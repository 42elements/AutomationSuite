// ==AutomationScript== 
// @name Webservice Inspector
// @version 1.0
// @date 01.01.2014
// @description Inspects arbitrary web services and generates JavaScript code for use within 42elements' Automation Suite.
// @author Philipp Lehmann
// @website http://42elements.com
// ==/AutomationScript==

var currentSession;

var form = new Form("SOAP Webservice Inspector");
form.icon = Icons32.ruby;
form.columnCount = 2;

// Our WSDL texbox with a sensible default
var tbxWsdl = new FormTextbox("https://issues.apache.org/jira/rpc/soap/jirasoapservice-v2?wsdl");
tbxWsdl.onKeyPress = function(key) {

    // Load the WSDL and list all services available
    currentSession = new SoapSession(tbxWsdl.text);
    cbxServices.items = currentSession.services;
    
    if(cbxServices.items.length === 1)
    {
        cbxServices.value = cbxServices.items[0];
    }
};

// Add WSDL label and textbox to the form
form.addRow(new FormLabel("WSDL"), tbxWsdl);

// Create and add services label and combobox to the form
var cbxServices = new FormCombobox([]);
cbxServices.isEnabled = false;
cbxServices.onChange = function() {

    currentSession.service = cbxServices.value;
    lbxMethods.items = currentSession.getMethods();
};

form.addRow(new FormLabel("Services"), cbxServices);

// Create and add methods label and listbox to the form
var lblMethods = new FormLabel("Methods");
lbxMethods = new FormListbox([]);
lbxMethods.onChange = function() {

    // Display method signature
    lblMethodSignature.text = currentSession.getMethodSignature(lbxMethods.value);
    
    // Construct and display method's sample code
    var method = currentSession.getMethodSignature(lbxMethods.value, false);
    var createSession = "";
    var createComplexTypes = "";
    var createRequest = "";
    var paramPrefix = "";
    
    createSession += "var session = new SoapSession(\"" + tbxWsdl.text + "\");\r\n";
    createSession += "session.service = \"" + cbxServices.value + "\";\r\n\r\n";
    
    if(method.returnType !== "void")
    {
        createRequest += "var result = ";
        paramPrefix    = "             ";
    }
    
    createRequest += "session.createRequest(\"" + lbxMethods.value + "\")\r\n";
    
    for(var i = 0; i < method.parameters.length; ++i)
    {
        var param = method.parameters[i];
        
        if(param.type.contains("[]"))
        {
            createRequest += paramPrefix + "       .addArray([])\r\n";
        }
        else if(param.type === "decimal" ||
                param.type === "double" ||
                param.type === "short" ||
                param.type === "int" ||
                param.type === "long" ||
                param.type === "byte" ||
                param.type === "float" ||
                param.type === "unsignedShort" ||
                param.type === "unsignedInt" ||
                param.type === "unsignedLong")
        {
            createRequest += paramPrefix + "       .add" + param.type.substr(0, 1).toUpperCase() + 
                                                           param.type.substr(1) + "(0)\r\n";
        }
        else if(param.type === "string")
        {
            createRequest += paramPrefix + "       .addString(\"\")\r\n";
        }
        else if(param.type === "date")
        {
            createRequest += paramPrefix + "       .addDate(Date.now)\r\n";
        }
        else if(param.type === "boolean")
        {
            createRequest += paramPrefix + "       .addBoolean(false)\r\n";
        }
        else if(param.type === "base64Binary")
        {
            createRequest += paramPrefix + "       .addBase64Binary(BinaryDocument.fromFile(\"\"))\r\n";
        }
        else
        {
            var complexVarName = param.type.substr(0, 1).toLowerCase() + param.type.substr(1);
            createComplexTypes += "var " + complexVarName + " = session.createComplex(\"" + param.type + "\");\r\n";
            
            var complexParams = currentSession.getComplexSignature(param.type, false);
            
            complexParams.forEach(function(element){
            
                if(element.optional) {
                    createComplexTypes += "// ";
                }
            
                createComplexTypes += complexVarName + "." + element.name + " = null;\r\n";
            });
            
            createComplexTypes += "\r\n";
            
            createRequest += paramPrefix + "       .addComplex(" + complexVarName + ")\r\n";
        }
    }
    
    createRequest += paramPrefix + "       .send();\r\n";
    
    tbxJavaScript.text = createSession + createComplexTypes + createRequest;
};

form.addRow(lblMethods, lbxMethods);

// Create and add the method's signature labels to the form
var lblMethodSignatureCaption = new FormLabel("Method Signature");
lblMethodSignature = new FormLabel("");

form.addRow(lblMethodSignatureCaption, lblMethodSignature);

// Create and add the method's scaffolded code label and textbox to the form
var lblJavaScript = new FormLabel("JavaScript");
var tbxJavaScript = new FormTextbox("");
tbxJavaScript.isMultiline = true;
tbxJavaScript.font.name = "Courier New";
form.addRow(lblJavaScript, tbxJavaScript);

// Give the textboxes some nice dimensions
form.addRowSize(2, "absolute", 150);
form.addRowSize(4, "absolute", 150);
form.addColumnSize(1, "absolute", 700);

form.show();
    
false;
