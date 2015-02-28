// ==AutomationScript== 
// @name Star Director Screenshotter
// @property {Name: "newDirector", caption: "New Director", Type: "Text" }
// ==/AutomationScript==

var form = new Form({text: "Star Director Screenshotter", 
                     icon: Icons32.safari_browser, 
                     width: 1300, 
                     height: 800});

browser = new FormWebBrowser();

browser.onLoad = function() {
    
    // Open IMDB
    browser.load("http://www.imdb.com");
    browser.waitForPage();
    
    // Search for the new Star Wars movie
    browser.getNode("#navbar-query").setValue("star wars episode vii").submit();
    
    // Wait for the results
    var firstImdbResult = browser.waitForElement("table.findList tr.findResult:first-child td.result_text a");
    
    // We can also manipulate the HTML
    var allImdbResult = browser.getNode("table.findList tr.findResult td.result_text a");
    for(i = 0; i < allImdbResult.length; ++i)
    {
        allImdbResult[i].setStyle("color", "fuchsia");
    }
    
    // Now open the first imdb result
    firstImdbResult.click();
    
    // Wait for the rest of the page to load, then change the director
    var directorNameNode = browser.waitForElement("//div[@itemprop='director']/a/span[@itemprop='name']");
    browser.waitForPage();
    directorNameNode.text = properties["newDirector"];
    
    // See it & make a screenshot
    wait(5000);
    browser.image.saveAs("starWars.png");
    
    inform("Image has been saved.");
};

form.addRow(browser);
form.show();
    
false;
