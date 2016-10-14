//meant to parse lines into an array of terms in an xml file. The webpage will send the file to a server, where php scripts will take it from there. I should be able to grab most of this code from the existing systemsolver stuff.
/* target format: 
<system>
	<line>
	</line>
	...
	<log></log>
	<newline>
		<newterm side=("l"|"r")>
			<value>?</value>
			<id>?<id>
		</newterm>
		...
	</newline>
</system> */
function divToMul(match, p1, offset, string)
{
  var divisor = Number(p1);
  divisor = 1/divisor;
  return("*"+divisor);
}
function combineNums(match, p1, p2, p3, p4,  offset, string)
{
  var n1 = Number(p2);
  var n2 = Number(p4);
  var toreturn;
  if(p3 == "+"){toreturn=n1+n2;}
  else if (p3== "-"){toreturn = n1-n2;}
  else if (p3 == "*"){toreturn= n1*n2;}
  else if (p3 == "/"){toreturn = n1/n2;}
  return(p1+toreturn);
}
function countOccurences(str, substr)
{
  return((str.match(new RegExp(substr, "g"))||[]).length)
}
var num ="(?:\\d*\\.\\d+|\\d+)(?!\\d)";
var term = "(?:[+\\-]?(?:(?:"+num+")*[a-zA-Z]|"+num+")[/*])*(?:\\d*[a-zA-Z]|"+num+")(?=[+\\-]|$|[*+\\-/]\\(|[)=])";
function addToLine(myTerm, myLine, left)//variables count totals on left, constants on right
{
	//instead of pushing to a line array, i want to write these inside a <newline> tag in a string representing an existing xml file. 
  var xml="<system></system>";//placeholder for the xml string
	var myId;
  var myVal;
  var idMatch = myTerm.match(/[a-zA-Z]/);
  if(idMatch===null){myId = "num";}
  else{myId= idMatch[0];}
  myVal=Number(myTerm.match(new RegExp(num))[0]);
  //console.log("Term = "+myTerm+"\nValue = "+myVal);
	xml=xml.splice(0,-9);//remove the </system> tag from the end in preparation for writing to the end- move this elsewhere
	
  if(myTerm.search(/\-/)!=-1){myVal=myVal*-1;}
  for(i2=0;i2<myLine.length;i2++)
  {
    if((myLine[i2].id==myId)&&myId!="num")
    {
      switch(left)
        {
          case true:
            myLine[i2].value+=myVal;
            myLine[i2].value=round(myLine[i2].value, 15);
            return;
            break;
          case false:
            myLine[i2].value-=myVal;
            myLine[i2].value=round(myLine[i2].value, 15);
            return;
            break;
        }
    }
    else if(myLine[i2].id==myId&&myId=="num")
    {
      switch(left)
        {
          case true:
            myLine[i2].value-=myVal;
            myLine[i2].value=round(myLine[i2].value, 15);
            return;
            break;
          case false:
            myLine[i2].value+=myVal;
            myLine[i2].value=round(myLine[i2].value, 15);
            return;
            break;
        }
    }
  }
  var newEntry = new Object();
  newEntry.id= myId;
  if((left&&(myId!="num"))||(!left&&(myId=="num"))){newEntry.value=myVal;}
  else{newEntry.value = myVal*-1;}
  myLine.push(newEntry);
  return;
}
function ParseTerm(myTerm)
{
  if(countOccurences(myTerm, "[a-zA-Z]")>1)
  {
    var ERRDes = "ERR: term contains multiple variables.\nTerm = "+myTerm;
    return(ERRDes);
  }
  if(countOccurences(myTerm, "[/]")!=0)
  {
    var ERRDes = "ERR: invalid term (probably due to division by a variable). \nTerm = "+myTerm;
    return(ERRDes);
  }
  myTerm = replaceAll(myTerm, "([a-zA-Z])\\*((?:"+num+"\\*)*"+num+")(?!\\*)", "$2*$1");
  myTerm = replaceAll(myTerm,"("+num+")\\*("+num+")",
  function(match, p1, p2, offset, blah){return(String(Number(p1)*Number(p2)));});
  return(myTerm);
}
function replaceAll(line, regex, replacement)
{
  if(typeof regex == "string"){regex = new RegExp(regex,"g");}
  var compLine = line;
  line=line.replace(regex, replacement);
  while(compLine!=line)
  {
    compLine=line;
    line = line.replace(regex, replacement);
  }
  return(line);
}
function expand(line)//a*(b+c)->a*b+a*(c)||a*(c)->a*c()||a*c()->a*c
{
  var newline;
  var lastline;
  newline = line;
  var good = false;
  while(!good){
    while(lastline!=newline)
    {
      newline = newline.replace(/\+([+\-])/g, "$1");
      //-- -> +
      newline = newline.replace(/--/g, "+");
      lastline = newline;
      //handle a*(b+c) by doing a*(b+c+d+...+n)->a*b+a*(c+..+n). This eventually results in a*b+a*c+...+a*(n-1)+a*(n)
      newline = newline.replace(new RegExp("("+term+"[*])\\(("+term+"[+\\-])"), "$1$2$1(")
      //+- or ++ ->- or +
      //handle a+/-(b+/-...)-->a+/-b+/-(...)
      newline = newline.replace(new RegExp("("+term+"[+\\-])\\(("+term+"[+\\-])"), "$1$2(");
    }
    //console.log("partial expansion: "+newline);
    newline =replaceAll(newline, "([(+\\-]|^)("+num+")([+\\-*/])("+num+")(?=[+\\-)=]|$)", combineNums);//combine numbers
    //handle the artifacts at the end of the previous iterations
    newline = replaceAll(newline, "("+term+"[+\\-/*])\\(("+term+")\\)", "$1$2");
    newline = replaceAll(newline, "[/]("+num+")", divToMul);//if we end up getting a/(num), replace with a*(1/num)
    if(newline ==lastline)
    {
      good = true;
    }
  }

  return(newline);
}
function parse(line)
{
  //console.log("HI")
  var equ = replaceAll(line, /\s/g, "");
  openNum= countOccurences(equ, "\\(");
  closeNum = countOccurences(equ, "\\)");
  if(openNum!=closeNum)
  {
    var ERRDes;
    if(openNum>closeNum){ERRDes = "ERR: missing \")\"";}
    else{ERRDes = "ERR: missing \"(\"";}
    return(ERRDes);
  }
  var equalities = countOccurences(equ, "=");
  if(equalities==0)
  {
    return("ERR: Equations must include '='.");
  }
  else if(equalities>1)
  {
    var msgLog = "";
    equ=equ.split("=");
    for(j=0;j<equ.length-1;j++)
    {
      var newEqu = equ[j]+"="+equ[j+1];
      msgLog = msgLog+"Equation: "+newEqu+"\nResult: "+parse(equ[j]+"="+equ[j+1])+"\n";
    }
    return(msgLog);
  }
  //if(equ.match(new RegExp("(?!"+term+"|^|$|[+\\-/*()=])"))!= null)
  if(equ.match(/(?!^|$|[a-zA-Z]|[0-9.]|[+\-/*()=])/)!=null)
  {
    return("ERR: invalid character! (valid chars are +,-,/,*,(,),=, any letter, and numbers)");
  }
  equ = replaceAll(equ, "[/]("+num+")", divToMul);
  //equ = replaceAll(equ, /((?:\d*[a-z|A-Z]|\d+))\(/g, "$1*(");//x(->x*(
  equ = replaceAll(equ, "("+num+"|[a-zA-Z])\\(", "$1*(");
  equ = replaceAll(equ,"(\\([^()]*\\))("+term+")", "$2*$1");
  equ = replaceAll(equ, "("+num+")([A-Za-z])", "$1*$2");
  equ= replaceAll(equ, "([+\\-(=]|^)([a-zA-Z])", "$11*$2");
  //console.log("before expanded: "+equ);
  var expanded = expand(equ);
  //console.log("expanded: "+expanded);
  var newline = [];
  var numTerm = new Object();
  numTerm.id = "num";
  numTerm.value = 0;
  newline.push(numTerm);
  var sides = [];
  var currSideTerms = [];
  sides=expanded.split("=");
  currSideTerms = sides[0].split(/(?=[+\-])/);
  for(i = 0;i<currSideTerms.length;i++)
  {
    var newTerm = ParseTerm(currSideTerms[i]);
    if(newTerm.search("ERR")!=-1){return(newTerm);}
    addToLine(newTerm,newline,true);
  }
  currSideTerms = sides[1].split(/(?=[+\-])/);
  for(i = 0;i<currSideTerms.length;i++)
  {
    var newTerm = ParseTerm(currSideTerms[i]);
    if(newTerm.search("ERR")!=-1){return(newTerm);}
    addToLine(newTerm,newline,false);
  }
  /*for(i=0;i<newline.length;i++)
  {
    console.log(newline[i].id+", " + String(newline[i].value));
  }*/
  if((newline.length ==1)&&(newline[0].value!=0))
  {
    return("ERR: Equation yielded false statement\nValue= "+newline[0].value);
  }

  lines.push(newline);
  if(inputBox!=null){properDisplay("", inputBox);}
  displaySystem();
  return("Equation added to system");
}
