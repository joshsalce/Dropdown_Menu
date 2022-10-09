/*
Author: Josh Salce
Date: 08/29/2022
Description: This function creates and runs an API Call in Quickbase,
             Returns Data for All Reports For the ApexView 'Jobs' Table
             Data is then filtered to Report Name, QID
             Hyperlink is created and added to dictionary for each report

             Returns: Array of Dictionaries, Each Dictionary Representing a Single Report
*/
async function getReports() {       
    var tableID = "N/A"

    // API Call for Reports for ApexView 'Jobs' Table
    var res = await fetch('https://api.quickbase.com/v1/reports?tableId=' + tableID,
        {
            method: 'GET',
            headers: headers,
        });
    var response = await res.json();
    
    // Returns Necessary Info From API Call:
    //      Report Name, Field ID of Report, Hyperlink to Report in ApexView

    let reports = [];

    for(var i = 0; i < response.length; i++) {
        report = {};

        report['Name'] = response[i]['name'];
        report['QID'] = response[i]['id'];

        // https link edited out in this version
        report['Link'] = "Hyperlink N/A" + tableID + "?a=q&qid=" + response[i]['id'];

        reports.push(report);
    }
    
    // Returns Only Uniquely Named Reports (if necessary)
    var return_reports = Array.from(new Set(reports)).sort();
    return return_reports;
}


/*
Author: Josh Salce
Date: 08/29/2022
Description: This function creates and performs an API Call to Quickbase,
             Returns data for all Programs in the ApexView 'Programs' Table,
             Which is fitered to include only "Active(*)" Programs 
             
             Returns: Array of Dictionaries, Each Dictionary Representing a Single Active Program
*/
async function getActivePrograms() {
    var tableID = "N/A"

    // API Call to 'Programs' Table in ApexView, Only "Active(*)" Programs are returned 
    let body = {
        "from": tableID,
        "select":[3,6,11,17,111],
        "where":"{17.CT.'Active'}OR{17.CT.'Active*'}",
        "sortBy":
        [
            { "fieldId":3, "order":"ASC"}
        ]
    };

    var res = await fetch('https://api.quickbase.com/v1/records/query',
        {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        }
    );
    var response = await res.json();
    var res_data = response['data'];

    /*
    Returns Necessary Data From API Call:
          Customer Code for Each Program, "Program Name + ' ' + Year"
    
    Note: "Program Name + ' ' +  Year" makes identifying programs for the same customer 
    during different years easier
    */
    let active_programs = [];
    
    for(var i = 0; i < res_data.length; i++) {
        var info = {};
        info['Code'] = res_data[i]['11']['value'];
        info['Program'] = res_data[i]['6']['value'] + " " + res_data[i]['111']['value'];
        active_programs.push(info);
    }

    // Returns All Unique Active Programs, Following the "Program Name + ' ' + Year" Formula
    var actives = Array.from(new Set(active_programs)).sort();

    /*
    Check: Lengths are checked for duplicates, 
    same number as number of active programs in 'Active Programs' Table in ApexView
    */

    //console.log(active_programs.length);
    //console.log(actives.length);

    return actives;
}


/*
Author: Josh Salce
Date: 08/29/2022
Description: Creates and performs API Call to 'Customers' Table in Quickbase,
             Only the fields Customer Code and Customer Name are returned,
             which are put into a dictionary for each customer

             Returns: Array of Dictionaries for each Customer (Includes Name and Customer Code in Each Dict)
*/
async function getCustomerInfo() {
    var cus_tableID = "N/A"
    
    // API Call to 'Customers' Table in Quickbase,
    // Only Customer Name and Customer Code Are Returned
    let body = {
        "from": cus_tableID,
        "select":[6,9]
    };

    var res = await fetch('https://api.quickbase.com/v1/records/query',
        {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        }
    );
    var response = await res.json();
    var res_data = response['data'];

    // Streamlines API Call Data into Array of Dictionaries,
    // No Data is Manipulated or Changed, only redirected
    let return_info = [];

    for(var i = 0; i < res_data.length; i++) {
        customer = {};
        customer['Name'] = res_data[i]['6']['value'];
        customer['Code'] = res_data[i]['9']['value'];
        return_info.push(customer);
    }

    return return_info;
}


/*
Author: Josh Salce
Date: 08/29/2022
Description: Performs API Calls for ApexView 'Jobs' Report Names, ApexView 'Programs'
             Checks For Any Programs (Program Name  + " " + Year) That Do Not Have a Report with a Matching Name

             If There Are Any 'Missing' Reports, the Report Name that needs to be created is 
             added to the HTML Page below the 'APEXVIEW' Company Banner
*/
async function checkMatches() {
    // Gets All Report Names
    var reports = await getReports();
    var report_names = reports.map(({Name}) => Name);

    // Gets All 'Active' Programs
    var programs = await getActivePrograms();

    let nonmatches = 0;

    // Important Check: Checks All Reports for a Report Name That Matches the Report Naming Convention for Each Program.
    // NOTE: Report Name Must Follow the Formula: "Program Name + ' ' + Year = Report Name"
    
    for(var i = 0; i < programs.length; i++) {
        
        // If the Report Name Does Not Exist, HTML Is Added At the Bottom of the Page
        // As a Notification to Edit a Report Name or Create a New One (if needed)
        if(!report_names.includes(programs[i]['Program'])) {
            var div = document.getElementById("missing");
            
            var p = document.createElement("p");
            

            // Replaced with X so no sensitive info is given away
            p.innerHTML = programs[i]['Program'].replace(/[a-zA-Z'0-9]/g, 'X') + ': Make/Edit Report';
            
            div.append(p);

            nonmatches += 1;
        }
        else {
            continue;
        }
    }

    // Note: Below the 'APEXVIEW' Banner in the HTML Page is a newly added <div> element where 'Missing' Report Names Are Added
    // HTML is added dynamically ONLY when Reports are considered 'Missing'
    var div = document.getElementById("missing");
    var missing_reports = document.createElement("p");
    missing_reports.innerHTML = "Number of Missing Reports: " + nonmatches;
    
    if(nonmatches > 0) {
        div.append(missing_reports);
    } else {
        var good_message = document.createElement("p");
        good_message.innerHTML = "Number of Missing Reports: 0";
        div.append(good_message);
        
        //console.log("No issues with inaccurate or missing report names.")
    }

    return nonmatches;
} 


/*
Author: Josh Salce
Date: 08/29/2022
Description: This function gathers all of the data for each customer into a dictionary, 
             which is then added to an array that stores every customer's dictionary

             Note: The structure of the dictionary that 
             holds data for each customer is as follows:

             {
                'Customer Code': (str),
                'Customer Name': (str),
                'Programs' (Arr): [
                    {
                        'Report Name': (str),
                        'Report Link': (str)
                    }
                ]
                'Number of Programs': (int)
             }
*/
async function consolidatePrograms() {
    let customer_data = [];

    // API Call to 'Customers' table in ApexView
    var customers = await getCustomerInfo();
    
    // API Call to the 'Active Programs' table in ApexView
    var programs = await getActivePrograms();
    
    /*
    Important: This array contains the Customer Codes for all of the customers
    that have an active program. This will be used in the following for loop.
    */
    var cus_codes = programs.map(({Code}) => Code);
    
    /*
    This for loop is meant to 'filter' all of the customers that have at least one active program,
    and give those customers their own dictionary that contains their name, their name, and 
    an empty array that is supposed to hold all of their active programs, which will be populated later 

    Note: All of the customers in the 'Customers' table is looped over,
    but the condition that is checked is if their Customer Code is within the array 
    of Customer Codes that contain at least one active program.
    */
    for(var i = 0; i < customers.length; i++) {
        if(cus_codes.includes(customers[i]['Code'])) {
            let customer = {}
            customer['Customer Name'] = customers[i]['Name'];
            customer['Customer Code'] = customers[i]['Code'];
            customer['Programs'] = [];
            customer_data.push(customer)
        }
    }

    // This array contains all of the unique active programs in the ApexView 'Active Programs' Report
    // Note: The values in this array follow the naming convention "Program Name + ' ' + Year." This will be checked later
    var prog_names = programs.map(({Program}) => Program);
    
    // API Call to ApexView 'Jobs' Reports
    var rep_info = await getReports();

    /*
    This for loop iterates over the array of dictionaries for each report, it's QID, and it's hyperlink in ApexView

    The condition that is checked is if each report name is one of the values in the array of program names 

    If so, each report will have its own dictionary with values for its name and its hyperlink in ApexView,
    which is then added to an array with every active program's report (NOT sorted by customer yet)
    */
    let reps = []
    for(var i = 0; i < rep_info.length; i++) {
        if(prog_names.includes(rep_info[i]['Name'])) {
            let report = {};
            report['Report Name'] = rep_info[i]['Name'];
            report['Report Link'] = rep_info[i]['Link'];
            reps.push(report)
        }
    }

    /*
    This for loop iterates over all of the active programs and the array of 
    all reports that correspond to a single active program, and 
    adds to each dictionary a new key-value pair that holds a link to a report
    in ApexView whose name is the same as the program name
    */
    for(var i = 0; i < programs.length; i++) {
        for(var j = 0; j < reps.length; j++) {
            if(reps[j]['Report Name'] == programs[i]['Program']) {
                programs[i]['Report Link'] = reps[j]['Report Link'];
            }
        }
    }    

    /*
    This loop iterates over the array of dictionaries for each customer and all of the active programs (with links to their reports)
 

    The condition that is checked is if each program's Customer Code is the same as a particular customer's Customer Code

    For each program in which this is true, a dictionary that contains the matching report's name and link is created
    and added to the Array created in the first for loop that holds all of a customer's reports

    Each dictionary in the array will be effectively written to HTML in the 'sideways' dropdown menu for each customer.
    */
    for(var i = 0; i < customer_data.length; i++) {
        for(var j = 0; j < programs.length; j++) {
            if(programs[j]['Code'] == customer_data[i]['Customer Code']) {
                // A new dictionary must be created in order to keep each specific program's name and hyperlink together 
                let program = {
                    "Report Name": programs[j]['Program'], 
                    "Report Link": programs[j]['Report Link']
                }
                customer_data[i]['Programs'].push(program);

                // Check: The sum of all these values between every customer should equal the number of active programs in the 'Active Programs' Report
                customer_data[i]['Number of Programs'] = customer_data[i]['Programs'].length;
            }
        }
    }
    
    return customer_data;
}


/*
Author: Josh Salce
Date: 08/29/2022
Description: This is just a function to check and see all of the data in a particular array in Powershell. 
             This is not part of the functionality for achieving the script's final result, this was only used in
             the creation process. 
*/
async function seeAllData(data) {
    for(var i = 0; i < data.length; i++) {
        console.log(data[i]);
    }
}


/*
Author: Josh Salce
Date: 08/29/2022
Description: This function filters the array containing all of the customers, their active programs,
             and each's corresponding report according to the first letter of the Customer Name.

             Note: This function is necessary because the delimiters for the dropdown are arbitrary, and no
             built-in function can accomplish filtering the array in the same way this function can

             If the first letter is one of the two inputted letters or in between them, the dictionary
             containing that Customer Name value is added to an array
*/
async function splitByLetter(letter1, letter2, data) {
    let filtered_arr = []

    data.forEach(dict => {
        char1 = dict['Customer Name'].charAt(0);

        if((char1 >= letter1) && (char1 <= letter2)) {
            filtered_arr.push(dict)
        }
    });

    return filtered_arr;
}


/*
Date: 08/29/2022
Disclaimer: This is NOT an Original Function. I Found This on the Internet (Link Below).
            The purpose of this function is sort an array of dictionaries by a specific key-value that all of the dictionaries have.
            
            In this script, it is used to sort the array of dictionaries for each program and their reports
            by the 'Customer Name' field, so the array is returned by alphabetical order of all Customer Names

https://ourcodeworld.com/articles/read/764/how-to-sort-alphabetically-an-array-of-objects-by-key-in-javascript
*/
function dynamicSort(property) {
    var sortOrder = 1;

    if(property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }

    return function (a,b) {
        if(sortOrder == -1){
            return b[property].localeCompare(a[property]);
        }else{
            return a[property].localeCompare(b[property]);
        }        
    }
}


/*
Author: Josh Salce
Date: 08/29/2022
Description: This function writes each customer's unique dictionary and their data on each active program and its corresponding report
             to HTML, dynamically written to the document as the function runs

             Inputs: 
                     letter1 and letter2: Two letters that were also used to filter the array with every customer (see splitByLetter() function)
                        Now used as part of the label for the first dropdown that is shown in HTML, is not used in any filter function

                     data: Array of dictionaries that holds the customers whose first letter falls on or in between either of the
                     input letters, pre-filtered before it is passed into the function itself.

             Returns: HTML dropdown lists that are shown in the HTML page's navbar
*/
async function writeToDocument(letter1, letter2, data) {
    /*
    Note: The ul element that holds all of the dropdowns in the navbar was given
    the id "navigation" to make this easier
    */
    var ul = document.getElementById("navigation");
    
    /* Una Nota Importante:
        The big-picture structure for each dropdown in the navbar that is created 
        follows the following structure of HTML elements:

            li + a (Dropdown Name i.e. 'A-D')
                ul (Actual Dropdown List)
                    li + a (Customer Name)
                        ul ('Side' Dropdown list for all reports for a single customer)
                            li + a (Many of these are created, one for each unique report)
    */

    /*
    Creates the li & a elements that holds dropdown list of customer names 
    that fall under the 'delimiter' letters plus the dropdown name
    */
    var li_1 = document.createElement("li");
    li_1.className = "nav-item dropdown";

    var a_1 = document.createElement("a")
    a_1.innerHTML = letter1 + "-" + letter2
    a_1.className = "nav-link dropdown-toggle";
    a_1.setAttribute('id','navbarDropdown');
    a_1.setAttribute('href','#');
    a_1.setAttribute('role','button');
    a_1.setAttribute('data-toggle','dropdown');
    a_1.setAttribute('aria-expanded','false');

    li_1.append(a_1);


    // Creates the ul element that is the dropdown list for all of the customer names
    var ul_2 = document.createElement("ul");
    ul_2.className = "dropdown-menu";

    // Runs for each dictionary/customer (Input array 'data' should have already been filtered, see splitByLetter() function)
    data.forEach((customer) => {
        // First, the li + a elements for the customer's name is created, added to the li element =
        customer_li = document.createElement("li");

        inner_div = document.createElement("div");
        inner_div.innerHTML = customer['Customer Name'].replace(/[a-zA-Z'0-9-]/g, 'X');
        inner_div.className = "dropdown-item";

        customer_li.append(inner_div);

        // Second, the 'sideways' dropdown menu is created
        inner_ul = document.createElement("ul");
        inner_ul.className = "submenu dropdown-menu";
        
        /*
        For loop populations each cusomter's 'side' dropdown list with each of its unique programs,
        with report names and links added as well 
        */
        for(var i = 0; i < customer['Programs'].length; i++) {
            // Another li + a element is created for each unique report and added to the 'side' dropdown list 
            var report_li = document.createElement("li");

            var report_a = document.createElement("a");
            report_a.className = "dropdown-item";

            // Replaced to mask any sensitive info
            report_a.innerHTML = customer['Programs'][i]['Report Name'].replace(/[a-zA-Z'0-9]/g, 'X');
            
            report_a.setAttribute("href", customer['Programs'][i]['Report Link']);

            report_li.append(report_a);
            inner_ul.append(report_li);
        }

        /*
        Because each of these li and ul elements are nested inside of each other,
        appending them must come last
        */
        customer_li.append(inner_ul);
        ul_2.append(customer_li);
    });

    li_1.append(ul_2);
    ul.append(li_1)    
}


/*
Author: Josh Salce
Date: 08/29/2022
Description: This function writes the remaining parts of the navbar to HTML.
             
            Assuming the programs have been added already and this function is called afterwards, the
            function write to the HTML after the other dropdowns have been added to the HTML file.

             Note: The HTML is taken out of the html file and written after to
             keep the same layout of the navbar before this sript was written.
*/
async function addNonPrograms() {
    var ul = document.getElementById("navigation");
    
    // A separate <div> element is created for each dropdown, the layout is not changed by this
    var div1 = document.createElement("div");
    
    // 'Accounting Reports' Component of the navbar written 
    var accounting = '<li class="nav-item dropdown"> <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-toggle="dropdown" aria-expanded="false">XXXXXXXXX XXXXXXX</a>' + 
        '<ul class="dropdown-menu">' + 
            '<li>' + 
                '<a class="dropdown-item">XXXXXX XXXX XXXX XXXXXXXXX</a>' +
                '<a class="dropdown-item">XXXX XXX XXXXX</a>' +
                '<a class="dropdown-item">XXXXXX XXXXX</a>' + 
                '<a class="dropdown-item">XXXXXXX XXXXX</a>' + 
                '<a class="dropdown-item">XX XXXXXXX XXXXXX</a>' + 
                '<a class="dropdown-item">XXXX XXX</a> ' + 
                '<a class="dropdown-item">XXXXX XXXXXXX XXXXXXX</a>' +
            '</li>' + 
        '</ul> ' +
    '</li>'; 

    div1.innerHTML = accounting;


    // 'Job Map' Component of the navbar written last
    var div2 = document.createElement("div");
    var map = '<li class="nav-item dropdown">' + 
                    '<a class="nav-link"target="blank">XXX XXX</a>' +
                '</li>';
    
    div2.innerHTML = map;

    ul.appendChild(div1);
    ul.appendChild(div2)
}


/*
Author: Josh Salce
Date: 08/29/2022 
Description: Function that runs all of the necessary functions to generate the output shown in HTML
             Is called when the window loads in the ApexView Home Page
*/
async function main() {
    /*
    Puts each customer with an active program and their active programs into their own dictionary, which is part of an array
    Array of dictionaries then sorted by Customer Name
    */
    var programs_reports = await consolidatePrograms();
    var customer_dropdowns = programs_reports.sort(dynamicSort('Customer Name'));
    
    /*
    'Delimiters' that indicate which programs to include in a particular dropdown
    
    EX: "2": ['A', 'D'] means that the second dropdown will contain customers whose names
    begin with any of the letters 'A', 'D', or any of the letters in between.

    Change these to achieve a different looking result in ApexView Home Page
    */
    var dropdowns = {
        "1": ['0', '9'],
        "2": ['A', 'D'],
        "3": ['E', 'H'],
        "4": ['I', 'L'],
        "5": ['M', 'P'],
        "6": ['Q', 'T'],
        "7": ['U', 'Z']
    };

    // For loop that creates a dropdown according to the limits set by the two letters in each
    // entry within the above dictionary
    var keys = Object.keys(dropdowns);

    for(var i = 0; i < keys.length; i++) {
        var let_1 = dropdowns[keys[i]][0];
        var let_2 = dropdowns[keys[i]][1];
        
        // Filters the array with all of the customers
        var dropdown = await splitByLetter(let_1, let_2, customer_dropdowns);

        // Writes the filtered array to HTML
        writeToDocument(let_1, let_2, dropdown);
    }

    // Adds remaining dropdowns and links to navbar
    await addNonPrograms();

    // Checks for any reports that need to be edited or created
    // Note: May need to enlarge the html page while you're in ApexView to view this HTML
    await checkMatches();
}