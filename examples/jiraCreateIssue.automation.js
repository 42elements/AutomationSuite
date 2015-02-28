// ==AutomationScript==
// @name Add JIRA issue.
// @property {Name: "username", caption: "JIRA Username", Type: "Text" }
// @property {Name: "password", caption: "JIRA Password", Type: "Password" }
// ==/AutomationScript==

var session = new SoapSession("https://issues.apache.org/jira/rpc/soap/jirasoapservice-v2?wsdl");
session.service = "JiraSoapServiceService";

var token = session.createRequest("login")
                   .add(properties.username)
                   .add(properties.password)
                   .send();

var remoteIssue = session.createComplex("RemoteIssue");
remoteIssue.project = "AMQ";
remoteIssue.summary = "Issue title.";
remoteIssue.description = "Issue description.";
remoteIssue.duedate = Date.now.addDays(-1);
// ...

var result = session.createRequest("createIssue")
                    .addString(token)
                    .addComplex(remoteIssue)
                    .send();
