// ==AutomationScript== 
// @name Timesheet signer
// @dropstart *.xls*
// @property {Name: "name", Caption: "Name (part of the signature)", Type: "Text" }
// ==/AutomationScript==

function signTimesheets()
{
    // Let's fetch the files dropped on AutomationSuite
    var filenames = environment.dropStartFilepaths;
    
    // If the script was started without dropping a file, ask the user for some files
    if(filenames.length === 0)
    {
        filenames = File.openDialog({title: "Please choose the timesheets to sign.", filter: "Timesheets|*.xls*", multiSelect: true});
        
        if(filenames === null)
        {
            warn("No file has been choosen.");
            return false;
        }
    }
    
    for(var i = 0; i < filenames.length; ++i)
    {
        var filepath = filenames[i];
        
        // We could show a progress bar to show that it may take longer for many sheets
        ProgressDialog.show("Timesheets are being exported...", i, filenames.length);
        
        // Open the Excel file
        var lnWorkbook = new ExcelWorkbook(filepath);
        var lnSheet = lnWorkbook.sheets["LN"];
        
        // Export Excel sheet to PDF
        lnSheet.getCellRange(0, 0, 50, 11).exportToPdf(filepath + ".pdf");
        
        // Open the PDF and a canvas to paint on
        var pdfDocument = new PdfReader(filepath + ".pdf");
        var pdfPage = pdfDocument.pages[0];
        var pdfCanvas = pdfPage.openCanvas();
        
        // Prepare the font and measure sizings (let's be idealists here ;-)
        var signature = "Approved by " + properties.name;
        var date = Date.now.format("dd.MM.yyyy HH:mm:ss");
        var arial = new Font("Arial", 10);
        var width = signature.measure(arial) > date.measure(arial) ? signature.measure(arial) + 30 : date.measure(arial) + 30;
        var midPage = pdfPage.width / 2;
        
        // Now draw the surrounding rectangle and a line dividing the two strings
        pdfCanvas.drawRectangle({line: new Pen(Colors.black, 1),
                                 backgroundColor: new Color(255, 255, 255, 85),
                                 rectangle: new Rectangle(25, parseInt(midPage - width / 2), width, 40)}); 
        
        pdfCanvas.drawLine(new Pen(Colors.black, 0.5),
                           new Point(parseInt(midPage - width / 2), 45),
                           new Point(parseInt(midPage + width / 2), 45));
        
        // Now draw the two strings
        pdfCanvas.drawText({text: signature,
                            font: arial,
                            point: new Point(midPage, 40),
                            alignment: "center"});
        
        pdfCanvas.drawText({text: date,
                            font: arial,
                            point: new Point(midPage, 60),
                            alignment: "center"});
        
        // And a image optically supporting the signature
        pdfCanvas.drawImage(Icons32.tick,
                            new Point(parseInt(midPage + width / 2) - 12, 75));
                            
        pdfDocument.save();
    }
}

signTimesheets();
false;
