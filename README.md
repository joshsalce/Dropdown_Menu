# Dropdown Menu


Motivation: At any given time, there are customers with projects that are in progress, which could be classified as 'active.' Therefore, with a database and an API that can store this piece of information, there should be a webpage that is able to track when these projects are 'active' or not. However, tthe previous version of this webpage had every link to a report that can be included in the dropdown menu hard-coded. This causes two separate problems: first, everytime a project is made 'active' or not, a report link would have to be commented out or commented in every time. Second, when a new project is created, its report link must also be hard-coded into an ever-growing HTML page. A corollary of this is when a project is deleted, its report link must also either be commented out, which makes the code messier, or it can be deleted if it doesn't exist anymore to keep the page from becoming messier. 

This version of that webpage created in HTML, CSS, and JavaScript uses an API on multiple occasions to solve all of these problems. Multiple databases are accessed that write the same dropdown menu, which contains only currently 'active' programs at the time the webpage is loaded. A novel feature added to this version is code that will write HTML if there are any projects that do not have a report, and thus need one to be created in order for the project to appear in the dropdown menu.  

YouTube Video Demo: https://youtu.be/Q0BT1cTwYZ0

Disclaimer: No sensitive information with regards to customers, projects, or API tokens are included in this repo. All customer and project names are X'd out, and all sensitive info such as API user tokens, ID's, or personal hyperlinks used to access a database or a report have been removed from the code.
