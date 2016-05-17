window.onload = function(){
	document.getElementById('menu').addEventListener('change', updateForm);	
}

// Disables submission via pressing enter
window.addEventListener('keydown',function(e){
	if(e.keyIdentifier=='U+000A'||e.keyIdentifier=='Enter'||e.keyCode==13){
		if(e.target.nodeName=='INPUT'&&e.target.type=='text'){
			e.preventDefault();
			return false;
		}
	}
},true);

// Variables that keep count of filled forms
// More efficient method than constantly checking all required fields
var neededReq = -1, reqFilled = -1, initialValue;

// Implementation of the dropdown menu
// Calls getHTML to add form to page based on choice
var updateForm = function(e){
	var menu = document.getElementById('menu');
	var menuText = menu.options[menu.selectedIndex].text;
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
	neededReq = allReqs.length;
	reqFilled = 0;
	// Add event listeners to detect changes in new fields
	for(i = 0; i < allReqs.length; i++){
		allReqs[i].addEventListener('focus', beforeState);
		allReqs[i].addEventListener('blur', fieldCompleted);
		allReqs[i].addEventListener('keyup', checkField);
		if(allReqs[i].value)
			reqFilled++;
	}
	if(!document.getElementById('host'))
		return;
	// Special event listeners for "Host" field, needed for toggling additional fields
	if(document.title == 'Splunk Destination'){
		document.getElementById('host').addEventListener('blur', toggleFields);
		document.getElementById('host').addEventListener('keyup', checkField);
	}
	else{
		document.getElementById('host').removeEventListener('blur', toggleFields);
		document.getElementById('host').removeEventListener('keyup', checkField);
	}
};

// Used in toggle Fields
// Adds the SSH forms when the "Host" field is not "localhost"
var addSSH = function(response){
	var currentContent = document.getElementById('ssh');
	var newContent = response.getElementById('sshForm');
	currentContent.innerHTML = newContent.innerHTML;
	var reqForms = currentContent.getElementsByClassName('isReq');
	neededReq += reqForms.length;
	// Add event listener for those forms as well
	for(i = 0; i < reqForms.length; i++){
		reqForms[i].addEventListener('focus', beforeState);
		reqForms[i].addEventListener('blur', fieldCompleted);
		if(reqForms[i].value)
			reqFilled++;
	}
};

// Used in toggle Fields
// Removes the SSH forms when the "Host" field is "localhost"
function removeSSH(){
	var currentContent = document.getElementById('ssh');
	var reqForms = currentContent.getElementsByClassName('isReq');
	neededReq -= reqForms.length;
	for(i = 0; i < reqForms.length; i++){
			if(reqForms[i].value)
				reqFilled--;
			reqForms[i].removeEventListener('focus', beforeState);
			reqForms[i].removeEventListener('blur', fieldCompleted);
	}
	document.getElementById('ssh').innerHTML = '';
}

// Toggles the SSH fields based on value of the "Host" field
var toggleFields = function(e){
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
	if(!e.value || (e.srcElement.getAttribute('id') == 'host' && e.srcElement.value != 'localhost')){
		document.getElementById('save').disabled = true;
	}
};

// Helper function to keep track of orginal field value before changing it
var beforeState = function(e){
	var target = e.srcElement;
	initialValue = target.value;
};

// Update count of filled required fields based on the field's value
var fieldCompleted = function(e){
	var target = e.srcElement;
	if(target.value && !initialValue)
		reqFilled++;
	if(!target.value && initialValue)
		reqFilled--;
	checkCompletion();
};

// Enable/ Disable button if all required fields filled
function checkCompletion(){
	document.getElementById('save').disabled = reqFilled != neededReq;
}