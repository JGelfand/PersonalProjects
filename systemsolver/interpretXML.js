//plan:
/*<system>
    <line>
      <term>
        <id>num</id>
        <value>value</value>
      </term>
      <term>
        <id>not_num</id>
        <value>value</value>
      </term>
    </line>
    <line>
      ...
    </line>
    ...
    <log>*longish string*</log>
  </system>
  converts lines to a proper display format, displays them in an html table
  lines are of the form term+term+term+...+term=numterm, where numterm is a term with id of "num"
  displays log in another area*/
var sysDisplay=null
var logDisplay=null
function simpleNodeVal(myNode){
  return myNode.childNodes[0].nodeValue;
}
function configDisplay(sys, log){
  sysDisplay=document.getElementById(sys);
  logDisplay=document.getElementById(log);
}
function toLog(msg){
  logDisplay.value=msg;
}
function toSys(htmlTable){
  sysDisplay.innerHTML = htmlTable;
}
function linFind(element, array){
  var i;
  for(i=0;i<array.length;i++){
    if(element==array[i]){
      return i;
    }
  }
  return -1;
}
function xmlToTable(xmlDoc){
  var tablehtml="<table>";
  xml=xmlDoc.responseXML;
  var idArray=[];
  idArray.push("num");
  var lines = xml.getElementsByTagName("line");
  //populate the id array
  var i1;
  for(i1=0;i1<lines.length;i1++){
    var terms= lines[i1].getElementsByTagName("term");
    var i2;
    for(i2=0;i2<terms.length;i2++){
      var term = terms[i2];
      termID=simpleNodeVal(term.getElementsByTagName("id")[0]);
      newTerm=linFind(termID, idArray)==-1;
      if(newTerm){
        idArray.push(termID);
      }
    }
  }
	console.log(idArray);
  //initialize the table
  /*tablehtml=tablehtml+"<tr>"
  for(i1=0;i1<=idArray.length;i1++){//1 row for every variable, 1 for the = sign
    tablehtml=tablehtml+"<th></th>";
  }
  tablehtml=tablehtml+"</tr>";*/ //UNNECESSARY?
  //make a table row for every line
  for(i1=0;i1<lines.length;i1++){
    tablehtml=tablehtml+"<tr>"
    var terms =lines[i1].getElementsByTagName("term");
    termIdArray=[];
    var i2;
    for(i2=0;i2<terms.length;i2++){
      termIdArray.push(simpleNodeVal(terms[i2].getElementsByTagName("id")[0]));
    }
    for(i2=1;i2<idArray.length;i2++){
      tablehtml=tablehtml+"<td>";
      //check if line has a term that matches idArray[i2]
      var termIndex=linFind(idArray[i2], termIdArray);
      //if so, add it to the line. else, blank cell
      if(termIndex!=-1){
        var idNode=terms[i2].getElementsByTagName("id")[0];
        var valNode=terms[i2].getElementsByTagName("value")[0];
        tablehtml=tablehtml+simpleNodeVal(valNode)+simpleNodeVal(idNode);
        tablehtml=tablehtml+"+";
      }
      tablehtml=tablehtml+"</td>"
    }
    //end line with = num
    tablehtml=tablehtml.slice(0,-6)+"</td><td>=";
    var numNode= terms[0];
    var numNodeVal=numNode.getElementsByTagName("value")[0];
    tablehtml=tablehtml+simpleNodeVal(numNodeVal);
    tablehtml=tablehtml+"</td>"+"</tr>";
  }
	tablehtml=tablehtml+"</table>";
	return tablehtml;
}
