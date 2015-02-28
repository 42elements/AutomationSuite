// ==AutomationScript== 
// @name Webservice Inspector
// @version 1.0
// @date 01.01.2014
// @description Inspects arbitrary web services and generates JavaScript code for use within 42elements' Automation Suite.
// @author Philipp Lehmann
// @email [email protected]
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
};

form.addRow(lblMethods, lbxMethods);

// Create and add the method's signature labels to the form
var lblMethodSignatureCaption = new FormLabel("Method Signature");
lblMethodSignature = new FormLabel("");

form.addRow(lblMethodSignatureCaption, lblMethodSignature);

// Give the textboxes some nice dimensions
form.addRowSize(2, "absolute", 150);
form.addColumnSize(1, "absolute", 700);

form.show();
    
false;
