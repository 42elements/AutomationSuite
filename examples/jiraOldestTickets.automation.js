// ==AutomationScript==
// @name Top 10 oldest open JIRA tickets
// @property {Name: "username", caption: "JIRA Username", Type: "Text" }
// @property {Name: "password", caption: "JIRA Password", Type: "Password" }
// ==/AutomationScript==

var session = new SoapSession("https://issues.apache.org/jira/rpc/soap/jirasoapservice-v2?wsdl");
session.service = "JiraSoapServiceService";

var token = session.createRequest("login")
                   .add(properties.username)
                   .add(properties.password)
                   .send();

var jql = "project = AMQ AND issuetype = Bug AND status = Open ORDER BY created DESC";

var issues = session.createRequest("getIssuesFromJqlSearch")
                    .add(token)
                    .add(jql)
                    .add(10)
                    .send();

var keys = [];
issues.forEach(function(issue) {

    keys.push(issue.key);
});

alert(keys);
