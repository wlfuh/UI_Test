window.onload = function(){
	document.getElementById('menu').addEventListener('change', updateForm, true);	
}

// Disables submission via pressing enter
window.addEventListener('keydown',function(e){
	e = e || window.event;
	if(e.keyIdentifier=='U+000A'||e.keyIdentifier=='Enter'||e.keyCode==13){
		if(e.target.nodeName=='INPUT'&&e.target.type=='text'){
			e.preventDefault();
			return false;
		}
	}
},true);

var initialValue;

// Implementation of the dropdown menu
// Calls getHTML to add form to page based on choice
var updateForm = function(e){
	var menu = document.getElementById('menu');
	var menuText = menu.options[menu.selectedIndex].text;
	var alerts = document.getElementsByClassName('alerts');
	for(i = 0; i < alerts.length; i++){
		removeAlert(i);
	}
	if(menuText == 'No selection')
		document.title = 'UI Test';
	else
		document.title = menuText + ' Destination';
	switch(menuText){
		case 'Arcsight ESM':
			getHTML('arcsight.html', replaceForm);
			break;
		case 'Splunk':
			getHTML('splunk.html', replaceForm);
			break;
		case 'CSV':
			getHTML('csv.html', replaceForm);
			break;
		default:
			document.getElementById('content').innerHTML = '';
			break;
	}
	
}

// Grabs HTML code from url and calls callback function
var getHTML = function (url, callback) {
 	if ( !window.XMLHttpRequest ) return;
 	var xhr = new XMLHttpRequest();
 	xhr.onload = function() {
 	    if ( callback && typeof( callback ) === 'function' ) {
 	        callback(this.responseXML);
 	    }
 	}
 	xhr.open( 'GET', url );
 	xhr.responseType = 'document';
 	xhr.send();
};

// Callback function used in getHTML
// Replaces content on current page with content from response
var replaceForm = function(response){
	var currentContent = document.getElementById('content');
	var newContent = response.getElementById('theForm');
	currentContent.innerHTML = newContent.innerHTML;
	var allReqs = document.getElementsByClassName('isReq');
	// Add event listeners to detect changes in new fields
	for(i = 0; i < allReqs.length; i++){
		allReqs[i].addEventListener('focus', beforeState, true);
		allReqs[i].addEventListener('blur', fieldCompleted, true);
		allReqs[i].addEventListener('keyup', checkField, true);
	}
	if(!document.getElementById('host'))
		return;
	// Special event listeners for "Host" field, needed for toggling additional fields
	if(document.title == 'Splunk Destination'){
		document.getElementById('host').addEventListener('blur', toggleFields, true);
		document.getElementById('host').addEventListener('keyup', checkField, true);
	}
	else{
		document.getElementById('host').removeEventListener('blur', toggleFields, true);
		document.getElementById('host').removeEventListener('keyup', checkField, true);
	}
};

// Used in toggle Fields
// Adds the SSH forms when the "Host" field is not "localhost"
var addSSH = function(response){
	var currentContent = document.getElementById('ssh');
	var newContent = response.getElementById('sshForm');
	currentContent.innerHTML = newContent.innerHTML;
	var reqForms = currentContent.getElementsByClassName('isReq');
	// Add event listener for those forms as well
	for(i = 0; i < reqForms.length; i++){
		reqForms[i].addEventListener('focus', beforeState, true);
		reqForms[i].addEventListener('blur', fieldCompleted, true);
	}
};

// Used in toggle Fields
// Removes the SSH forms when the "Host" field is "localhost"
function removeSSH(){
	var currentContent = document.getElementById('ssh');
	var reqForms = currentContent.getElementsByClassName('isReq');
	for(i = 0; i < reqForms.length; i++){
			reqForms[i].removeEventListener('focus', beforeState, true);
			reqForms[i].removeEventListener('blur', fieldCompleted, true);
	}
	document.getElementById('ssh').innerHTML = '';
}

// Toggles the SSH fields based on value of the "Host" field
var toggleFields = function(e){
	e = e || window.event;
  var target = e.target || e.srcElement;
	hostDOM = document.getElementById('host');
	if(hostDOM.value != 'localhost'){
		if(document.getElementById('ssh').innerHTML == ''){
			getHTML('ssh.html', addSSH);
		}
	}
	else{
		removeSSH();
	}
};

// Extra precaution to make sure empty required fields and future empty fields (such as those added from changing "Host" field)
// are not submitted by mistake
var checkField = function(e){
	e = e || window.event;
  var target = e.target || e.srcElement;
	if(!e.value || (e.srcElement.getAttribute('id') == 'host' && e.srcElement.value != 'localhost')){
		document.getElementById('save').disabled = true;
	}
};

// Helper function to keep track of orginal field value before changing it
var beforeState = function(e){
	e = e || window.event;
  var target = e.target || e.srcElement;
	initialValue = target.value;
};

// Update count of filled required fields based on the field's value
var fieldCompleted = function(e){
	e = e || window.event;
  var target = e.target || e.srcElement;
	if(target.getAttribute('id') == 'host' && target.value != 'localhost'){
		document.getElementById('save').disabled = true;
		target.style.border = "1px red solid";
	  updateAlert('Host can only be "localhost"', 0);
		return;
	}
	if(target.getAttribute('id') == 'host' && target.value == 'localhost'){
		target.style.border = "";
		removeAlert(0);
	}
	if(target.getAttribute('name') == 'port'){
		if(!isInteger(target.value)){
			target.style.border = "1px red solid";
			updateAlert('Port must be an integer', 1);
			document.getElementById('save').disabled = true;
			return;
		}
		target.style.border = "";
		removeAlert(1);
	}
	checkCompletion();
};

// Enable/ Disable button if all required fields filled and there are no warnings
function checkCompletion(){
	var saveButton = document.getElementById('save');
	var allReqs = document.getElementsByClassName('isReq');
	var alerts = document.getElementsByClassName('alert');
	for(i = 0; i < alerts.length; i++){
		if(alerts[i].style.visibility == "visible"){
			saveButton.disabled = true;
			return;
		}
	}
	for(i = 0; i < allReqs.length; i++){
		if(!allReqs[i].value){
			saveButton.disabled = true;
			return;	
		}
	}
	saveButton.disabled = false;
}

// Add error message
// id: 0 - host 1 - port
function updateAlert(message, id){
	if(id >= document.getElementsByClassName('alert').length)
		return;
	var alert = document.getElementsByClassName('alert')[id];
	alert.style.visibility="visible";
	alert.innerHTML = message;	
}

// Remove error message
// id: 0 - host 1 - port
function removeAlert(id){
	var port = document.getElementsByName('port')[0] , host = document.getElementById('host');
	if(id == 0 && host && host.value != 'localhost')
		return;
	if(id == 1 && port && !isInteger(port.value))
		return;
	var alert = document.getElementsByClassName('alert')[id];
	alert.style.visibility="hidden";
}

// Check if input is an integer
function isInteger(input){
	for(i = 0; i < input.length; i++){
			if(input.charCodeAt(i) < 48 || input.charCodeAt(i) > 57){
				return false;
			}	
	}
	return true;
}