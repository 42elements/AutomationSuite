// ==AutomationScript==
// @name Confluence Lib
// @module
// @version 1
// @date 01.03.2015
// @description A Module for accessing the confluence SOAP API.
// @author 42elements
// ==/AutomationScript==

function Confluence(href, username, password) {

    // Properties
    this.href = href;
    this.session = null;
    this.token = null;
    this.spaceKeys = [];

    // Constructor
    this.session = new SoapSession(href + "/rpc/soap-axis/confluenceservice-v2?wsdl", "ConfluenceSoapServiceService");

    this.token = this.session.login(username, password);

    var spacesVector = this.session.getSpaces(this.token);

    spacesVector.forEach(function(currentValue) {

        if(currentValue.type == 'global')
        {
            this.spaceKeys.push(currentValue.key);
        }
    }, this);

    // Methods
    this.getPages = function(spaceKey) {

        var pages = [];

        ProgressDialog.show("Loading pages.");

        var pagesVector = this.session.createRequest("getPages")
                                      .addString(this.token)
                                      .addString(spaceKey)
                                      .send();

        ProgressDialog.show("Analyzing pages.");

        pagesVector.forEach(function(currentValue) {

            pages.push(currentValue.title + " (" + currentValue.id + ")");
        }, this);

        ProgressDialog.hide();

        return pages;
    }

    this.copyPages = function(fromBelowPageId, toConfluence, toSpace, toBelowPageId) {

        ProgressDialog.show("Creating page hierarchy.");

        var pageIds = [];
        var pageXisBelowY = {};
        this.createPageHierarchy(pageIds, pageXisBelowY, fromBelowPageId);
        
        var pageIdMapping = {};
        
        if(pageIds.length < 1)
        {
            inform("The chosen page does not have any children - nothing to copy.");
            return false;
        }
        
        for(var i = 0; i < pageIds.length; ++i)
        {
            ProgressDialog.show("Copying pages.", i, pageIds.length);
            var existingPageId = pageIds[i];
            
            var existingPage = this.session.createRequest("getPage")
                                           .addString(this.token)
                                           .addLong(existingPageId)
                                           .send();
                                    
            var newPage = toConfluence.session.createComplex("RemotePage");            
            newPage.content = existingPage.content;
            newPage.contentStatus = existingPage.contentStatus;
            newPage.title = existingPage.title;
            newPage.space = toSpace;
            
            if(existingPage.parentId == fromBelowPageId)
            {
                newPage.parentId = toBelowPageId;
            }
            else
            {
                newPage.parentId = pageIdMapping[existingPage.parentId];
            }
            
            try
            {
                newPage = toConfluence.session.createRequest("storePage")
                                              .addString(toConfluence.token)
                                              .addComplex(newPage)
                                              .send();
            }
            catch(e)
            {
                if(e.message.contains("A page already exists with the title"))
                {
                    var randomNumber = Math.floor(Math.random() * 99999) + 1;
                    newPage.title = existingPage.title + " [" + randomNumber + "]";
                        
                    newPage = toConfluence.session.createRequest("storePage")
                                                  .addString(toConfluence.token)
                                                  .addComplex(newPage)
                                                  .send();
                }
                else
                {
                    throw e;
                }
            }
                       
            pageIdMapping[existingPageId] = newPage.id;
            
            var attachmentVector = this.session.createRequest("getAttachments")
                                               .addString(this.token)
                                               .addLong(existingPageId)
                                               .send();
            
            attachmentVector.forEach(function(existingAttachment) {
            
                var attachmentBinaryDocument = this.session.createRequest("getAttachmentData")
                                                           .addString(this.token)
                                                           .addLong(existingAttachment.pageId) // or id
                                                           .addString(existingAttachment.fileName)
                                                           .addInt(0) // version. maybe retrieve version via existingAttachment.url?
                                                           .send();
                
                var newAttachment = toConfluence.session.createComplex("RemoteAttachment");
                newAttachment.comment = existingAttachment.comment;
                newAttachment.contentType = existingAttachment.contentType;
                newAttachment.created = existingAttachment.created;
                newAttachment.creator = properties.username2;
                newAttachment.fileName = existingAttachment.fileName;
                newAttachment.fileSize = existingAttachment.fileSize;
                newAttachment.pageId = newPage.id;
                newAttachment.title = existingAttachment.title;
    
                toConfluence.session.createRequest("addAttachment")
                                    .addString(toConfluence.token)
                                    .addLong(newPage.id)
                                    .addComplex(newAttachment)
                                    .addBase64Binary(attachmentBinaryDocument)
                                    .send();
            }, this);
        }
        
        var pageXisBelowYLength = 0;
        for (var x in pageXisBelowY)
        {
            if (pageXisBelowY.hasOwnProperty(x))
            {
                ++pageXisBelowYLength;
            }
        }
        
        var pageXisBelowYIndex = 0;
        for (var x in pageXisBelowY)
        {
            if (pageXisBelowY.hasOwnProperty(x))
            {
                ProgressDialog.show("Bringing pages in the right order.", pageXisBelowYIndex++, pageXisBelowYLength);
        
                toConfluence.session.createRequest("movePage")
                                    .addString(toConfluence.token)
                                    .addLong(pageIdMapping[x])
                                    .addLong(pageIdMapping[pageXisBelowY[x]])
                                    .addString("below")
                                    .send();
            }
        }

        ProgressDialog.hide();
    }

    this.removePages = function(fromBelowPageId) {

        ProgressDialog.show("Creating page hierarchy.");

        var pageIds = [];
        var pageXisBelowY = {};
        this.createPageHierarchy(pageIds, pageXisBelowY, fromBelowPageId);
        
        var pageIdMapping = {};
        
        if(pageIds.length < 1)
        {
            inform("The chosen page does not have any children - nothing to remove.");
            ProgressDialog.hide();
            return false;
        }
        
        var result = AutomationSuite.confirm({title: "Warning", 
                                              text: "You are about to remove " + pageIds.length + " pages from confluence!\n\nDo you want to proceed?", 
                                              buttons: "YesNo", 
                                              default: 2, 
                                              icon: "Warning"});
        
        if(result != 'Yes')
        {
            inform("Action was cancelled, nothing will be removed.");
            return false;
        }
        
        for(var i = 0; i < pageIds.length; ++i)
        {
            ProgressDialog.show("Removing pages.", i, pageIds.length);
            
            this.session.createRequest("removePage")
                        .addString(this.token)
                        .addLong(pageIds[i])
                        .send();
        }

        ProgressDialog.hide();
    }
    
    // Utility methods
    this.createPageHierarchy = function(pages, pageXisBelowY, parentPageId) {

        if(pages.length % 5 == 0 && pages.length != 0)
        {
            ProgressDialog.show("Creating page hierarchy (" + pages.length + " and counting)...");
        }

        var childrenPagesVector = this.session.createRequest("getChildren")
                                              .addString(this.token)
                                              .addLong(parentPageId)
                                              .send();

        childrenPagesVector.forEach(function(childPage, index) {

            pages.push(childPage.id);
            
            if(index != 0)
            {
                pageXisBelowY[childPage.id] = childrenPagesVector[index - 1].id;
            }

            this.createPageHierarchy(pages, pageXisBelowY, childPage.id);

        }, this);
    }
}
