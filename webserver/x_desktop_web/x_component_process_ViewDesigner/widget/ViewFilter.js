MWF.xApplication.process.ViewDesigner = MWF.xApplication.process.ViewDesigner || {};
MWF.xApplication.process.ViewDesigner.widget = MWF.xApplication.process.ViewDesigner.widget || {};

MWF.xApplication.process.ViewDesigner.widget.ViewFilter = new Class({
    Implements: [Options, Events],
    Extends: MWF.widget.Common,
    options: {
        "style": "default",
        "type": "identity",
        "names": []
    },
    initialize: function(node, app, filtrData, options){
        this.setOptions(options);
        this.node = $(node);
        this.app = app;
        this.filtrData = filtrData;

        this.path = "/x_component_process_ViewDesigner/widget/$ViewFilter/";
        this.cssPath = "/x_component_process_ViewDesigner/widget/$ViewFilter/"+this.options.style+"/css.wcss";
        this._loadCss();

        this.items = [];
        this.load();

    },
    load: function(data){
        this.getInputNodes();
        this.createActionNode();
        //this.createAddNode();
        //this.loadIdentitys();
        this.loadData();
    },
    loadData: function(){
        if (this.filtrData.filtrData && this.filtrData.filtrData.length){
            this.filtrData.filtrData.each(function(data){
                this.items.push(new MWF.xApplication.process.ViewDesigner.widget.ViewFilter.Item(this, data));
            }.bind(this));
        }

        if (this.filtrData.customData && this.filtrData.customData.length){
            this.filtrData.customData.each(function(data){
                data.type = "custom";
                this.items.push(new MWF.xApplication.process.ViewDesigner.widget.ViewFilter.ItemCustom(this, data));
            }.bind(this));
        }
    },

    createScriptArea: function(node){
        this.scriptValueArea = node;
        var title = node.get("title");

        MWF.require("MWF.widget.ScriptArea", function(){
            this.scriptArea = new MWF.widget.ScriptArea(node, {
                "title": title,
                "maxObj": this.app.formContentNode || this.app.pageContentNode,
                "onChange": function(){
                    this.scriptData = this.scriptArea.toJson();
                }.bind(this),
                "onSave": function(){
                    //this.app.saveForm();
                }.bind(this),
                "style": "formula"
            });
            var v = (this.scriptData) ? this.scriptData.code : "";
            this.scriptArea.load(v);
        }.bind(this));
    },

    getInputNodes: function(){
        this.inputAreaNode = this.node.getFirst("div");
        this.actionAreaNode = this.inputAreaNode.getNext().setStyles(this.css.actionAreaNode);
        this.listAreaNode = this.actionAreaNode.getNext().getNext();
        this.fieldListAreaNode = this.listAreaNode.getNext().getNext();
        this.restrictViewFilterTable = this.inputAreaNode.getLast("table");

        var selects = this.inputAreaNode.getElements("select");
        var inputs = this.inputAreaNode.getElements("input");

        var scriptValueArea = this.node.getElement(".MWFFilterFormulaArea");
        if (scriptValueArea){
            this.createScriptArea(scriptValueArea);
        }


        this.titleInput = inputs[0];
        this.pathInput = inputs[1];
        this.datatypeInput = selects[0];

        this.restrictFilterInput = inputs[2];
        this.customFilterInput = inputs[3];

        this.logicInput = selects[1];
        this.comparisonInput = selects[2];
        this.valueTextInput = inputs[4];
        this.valueNumberInput = inputs[5];
        this.valueDatetimeInput = inputs[6];
        this.valueBooleanInput = selects[3];

        MWF.require("MWF.widget.Calendar", function(){
            this.calendar = new MWF.widget.Calendar(this.valueDatetimeInput, {
                "style": "xform",
                "isTime": true,
                "target": this.app.content,
                "format": "db"
            });
        }.bind(this));

        this.datatypeInput.addEvent("change", function(){
            this.changeValueInput();
        }.bind(this));

        this.valueTextInput.addEvent("keydown", function(e){
            debugger;
            if (e.code==13) this.modifyOrAddFilterItem();
        }.bind(this));
        this.valueNumberInput.addEvent("keydown", function(e){
            if (e.code==13) this.modifyOrAddFilterItem();
        }.bind(this));
    },
    changeValueInput: function(){
        var type = this.datatypeInput.options[this.datatypeInput.selectedIndex].value;
        switch (type){
            case "textValue":
                this.valueTextInput.setStyle("display", "block");
                this.valueNumberInput.setStyle("display", "none");
                this.valueDatetimeInput.setStyle("display", "none");
                this.valueBooleanInput.setStyle("display", "none");
                break;
            case "numberValue":
                this.valueTextInput.setStyle("display", "none");
                this.valueNumberInput.setStyle("display", "block");
                this.valueDatetimeInput.setStyle("display", "none");
                this.valueBooleanInput.setStyle("display", "none");
                break;
            case "datetimeValue":
                this.valueTextInput.setStyle("display", "none");
                this.valueNumberInput.setStyle("display", "none");
                this.valueDatetimeInput.setStyle("display", "block");
                this.valueBooleanInput.setStyle("display", "none");
                break;
            case "booleanValue":
                this.valueTextInput.setStyle("display", "none");
                this.valueNumberInput.setStyle("display", "none");
                this.valueDatetimeInput.setStyle("display", "none");
                this.valueBooleanInput.setStyle("display", "block");
                break;
        }
    },
    createActionNode: function(){
        this.actionNode = new Element("div", {"styles": this.css.actionNode}).inject(this.actionAreaNode);
        this.actionNode.addEvent("click", function(){
            this.modifyOrAddFilterItem();
        }.bind(this));
    },
    modifyOrAddFilterItem: function(){
        if (this.currentFilterItem){
            this.modifyFilterItem();
        }else{
            if (this.restrictFilterInput.checked){
                this.addFilterItem();
            }else{
                this.addCustomFilterItem();
            }
        }
    },
    modifyFilterItem: function(){
        var data = this.getInputData();
        if (this.verificationData(data)){
            this.currentFilterItem.reload(data);
            this.currentFilterItem.unSelected();
            this.fireEvent("change");
        }
    },
    addFilterItem: function(){
        var data = this.getInputData();
        if (this.verificationData(data)){
            this.items.push(new MWF.xApplication.process.ViewDesigner.widget.ViewFilter.Item(this, data));
            this.fireEvent("change");
        }
    },
    addCustomFilterItem: function(){
        var data = this.getInputData();
        if (this.verificationDataCustom(data)){
            this.items.push(new MWF.xApplication.process.ViewDesigner.widget.ViewFilter.ItemCustom(this, data));
            this.fireEvent("change");
        }
    },
    verificationData: function(data){
        if (!data.path){
            this.verificationNode = new Element("div", {"styles": this.css.verificationNode}).inject(this.inputAreaNode);
            new Element("div", {"styles": this.css.verificationTextNode, "text": this.app.lp.mastInputPath}).inject(this.verificationNode);
            this.pathInput.focus();
            this.pathInput.setStyle("background-color", "#fbe8e8");

            this.pathInput.addEvents({
                "keydown": function(){
                    if (this.verificationNode){
                        this.verificationNode.destroy();
                        this.verificationNode = null;
                        this.pathInput.setStyle("background-color", "#FFF");
                    }
                }.bind(this),
                "click": function(){
                    if (this.verificationNode){
                        this.verificationNode.destroy();
                        this.verificationNode = null;
                    }
                }.bind(this)
            });
            return false;
        }
        return true;
    },
    verificationDataCustom: function(data){
        if (!data.title){
            this.verificationNode = new Element("div", {"styles": this.css.verificationNode}).inject(this.inputAreaNode);
            new Element("div", {"styles": this.css.verificationTextNode, "text": this.app.lp.mastInputTitle}).inject(this.verificationNode);
            this.titleInput.focus();
            this.titleInput.setStyle("background-color", "#fbe8e8");

            this.titleInput.addEvents({
                "keydown": function(){
                    if (this.verificationNode){
                        this.verificationNode.destroy();
                        this.verificationNode = null;
                        this.titleInput.setStyle("background-color", "#FFF");
                    }
                }.bind(this),
                "click": function(){
                    if (this.verificationNode){
                        this.verificationNode.destroy();
                        this.verificationNode = null;
                    }
                }.bind(this)
            });
            return false;
        }
        if (!data.path){
            this.verificationNode = new Element("div", {"styles": this.css.verificationNode}).inject(this.inputAreaNode);
            new Element("div", {"styles": this.css.verificationTextNode, "text": this.app.lp.mastInputPath}).inject(this.verificationNode);
            this.pathInput.focus();
            this.pathInput.setStyle("background-color", "#fbe8e8");

            this.pathInput.addEvents({
                "keydown": function(){
                    if (this.verificationNode){
                        this.verificationNode.destroy();
                        this.verificationNode = null;
                        this.pathInput.setStyle("background-color", "#FFF");
                    }
                }.bind(this),
                "click": function(){
                    if (this.verificationNode){
                        this.verificationNode.destroy();
                        this.verificationNode = null;
                    }
                }.bind(this)
            });
            return false;
        }
        return true;
    },
    getInputData: function(){
        var logic = this.logicInput.options[this.logicInput.selectedIndex].value;
        var path = this.pathInput.get("value");
        var title = this.titleInput.get("value");
        if (this.restrictFilterInput.checked) var type = "restrict";
        if (this.customFilterInput.checked) var type = "custom";

        var comparison = this.comparisonInput.options[this.comparisonInput.selectedIndex].value;
        var formatType = this.datatypeInput.options[this.datatypeInput.selectedIndex].value;
        var value = "";
        switch (formatType){
            case "textValue":
                value = this.valueTextInput.get("value");
                break;
            case "numberValue":
                value = this.valueNumberInput.get("value").toFloat();
                break;
            case "datetimeValue":
                value = this.valueDatetimeInput.get("value");
                break;
            case "booleanValue":
                value = this.valueBooleanInput.options[this.valueBooleanInput.selectedIndex].value;
                if (value=="true"){
                    value = true;
                }else{
                    value = false;
                }
                break;
        }
        return {
            "logic": logic,
            "path": path,
            "title": title,
            "type": type,
            "comparison": comparison,
            "formatType": formatType,
            "value": value,
            "code": this.scriptData
        }
    },

    setData: function(data){
        for (var i=0; i<this.logicInput.options.length; i++){
            if (this.logicInput.options[i].value===data.logic){
                this.logicInput.options[i].set("selected", true);
                break;
            }
        }
        this.titleInput.set("value", data.title);
        this.pathInput.set("value", data.path);

        for (var i=0; i<this.comparisonInput.options.length; i++){
            if (this.comparisonInput.options[i].value===data.comparison){
                this.comparisonInput.options[i].set("selected", true);
                break;
            }
        }

        for (var i=0; i<this.datatypeInput.options.length; i++){
            if (this.datatypeInput.options[i].value===data.formatType){
                this.datatypeInput.options[i].set("selected", true);
                break;
            }
        }

        switch (data.formatType){
            case "textValue":
                this.valueTextInput.set("value", data.value);
                break;
            case "numberValue":
                this.valueNumberInput.set("value", data.value);
                break;
            case "datetimeValue":
                this.valueDatetimeInput.set("value", data.value);
                break;
            case "booleanValue":

                for (var i=0; i<this.valueBooleanInput.options.length; i++){
                    var v = this.valueBooleanInput.options[i].value;
                    if (v=="true"){
                        v = true;
                    }else{
                        v = false;
                    }
                    if (v===data.value){
                        this.valueBooleanInput.options[i].set("selected", true);
                        break;
                    }
                }
                break;
        }
        this.scriptData = data.code;
        if (this.scriptArea.editor) this.scriptArea.editor.setValue(this.scriptData.code);
    },

    deleteItem: function(item){
        if (this.currentFilterItem == item) item.unSelected();
        this.items.erase(item);
        item.node.destroy();
        MWF.release(item);
        this.fireEvent("change");
    },
    getData: function(){
        var data = [];
        var customData = [];
        this.items.each(function(item){
            if (item.data.type==="custom"){
                customData.push(item.data);
            }else{
                data.push(item.data);
            }
        }.bind(this));
        return {"data": data, "customData": customData};
    }
});



MWF.xApplication.process.ViewDesigner.widget.ViewFilter.Item = new Class({
    Implements: [Events],
    initialize: function(filter, data){
        this.filter = filter;
        this.data = data;
        this.container = this.filter.listAreaNode;
        this.css = this.filter.css;
        this.app = this.filter.app;
        this.load();
    },
    load: function(){
        this.node = new Element("div", {"styles": this.css.itemNode}).inject(this.container);
        this.deleteNode = new Element("div", {"styles": this.css.itemDeleteNode}).inject(this.node);
        this.contentNode = new Element("div", {"styles": this.css.itemContentNode}).inject(this.node);
        this.contentNode.set("text", this.getText());

        this.contentNode.addEvent("click", function(){
            this.selected();
        }.bind(this));

        this.deleteNode.addEvent("click", function(e){
            this.deleteItem(e);
        }.bind(this));
    },
    getText: function(){
        var lp = this.app.lp.filter;
        return lp[this.data.logic]+" "+this.data.path+" "+lp[this.data.comparison] + " \""+"(S)"+"\"";
    },
    reload: function(data){
        this.data = data;
        this.contentNode.set("text", this.getText());
    },
    selected: function(){
        if (this.filter.currentFilterItem) this.filter.currentFilterItem.unSelected();
        this.node.setStyles(this.css.itemNode_current);
        this.filter.currentFilterItem = this;
        this.filter.setData(this.data);
    },
    unSelected: function(){
        this.node.setStyles(this.css.itemNode);
        this.filter.currentFilterItem = null;
        this.filter.currentItem = this;
    },
    deleteItem: function(e){
        var _self = this;
        this.filter.app.confirm("warn", e, this.app.lp.delete_filterItem_title, this.app.lp.delete_filterItem, 300, 120, function(){
            _self.destroy();
            this.close();
        }, function(){
            this.close();
        });
    },
    destroy: function(){
        this.filter.deleteItem(this);
    }
});
MWF.xApplication.process.ViewDesigner.widget.ViewFilter.ItemCustom = new Class({
    Extends: MWF.xApplication.process.ViewDesigner.widget.ViewFilter.Item,
    initialize: function(filter, data){
        this.filter = filter;
        this.data = data;
        this.container = this.filter.fieldListAreaNode;
        this.css = this.filter.css;
        this.app = this.filter.app;
        this.load();
    },
    getText: function(){
        var lp = this.app.lp.filter;
        return this.data.title+"("+this.data.path+")";
    }
});
