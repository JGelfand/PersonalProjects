//Written by Joseph Gelfand
var lines= [];
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
  else if (p3 == "*"){toreturn= n2*n2;}
  else if (p3 == "/"){toreturn = n1/n2;}
  return(p1+toreturn);
}
var num ="(?:\\d*\\.\\d+|\\d+)(?!\\d)"
var term = "(?:[+\\-]?(?:(?:"+num+")*[a-zA-Z]|"+num+")[/*])*(?:\\d*[a-zA-Z]|"+num+")(?=[+\\-]|$|[*+\\-/]\\(|[)=])"
function addToLine(myTerm, myLine, left)//variables count totals on left, constants on right
{
  var myId;
  var myVal;
  var idMatch = myTerm.match(/[a-zA-Z]/);
  //console.log(idMatch);
  if(idMatch===null){myId = "num";}
  else{myId= idMatch[0];}
  myVal=Number(myTerm.match(new RegExp(num))[0]);
  if(myTerm.search(/\-/)!=-1){myVal=myVal*-1;}
  //console.log("myId = "+myId);
  for(i2=0;i2<myLine.length;i2++)
  {
    if((myLine[i2].id==myId)&&myId!="num")
    {
      switch(left)
        {
          case true:
            myLine[i2].value+=myVal;
            return;
            break;
          case false:
            myLine[i2].value-=myVal;
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
            return;
            break;
          case false:
            myLine[i2].value+=myVal;
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
  myTerm = replaceAll(myTerm, new RegExp("([a-zA-Z])\\*((?:"+num+"\\*)*"+num+")(?!\\*)"), "$2*$1");
  myTerm = replaceAll(myTerm, new RegExp("("+num+")\\*("+num+")"),
  function(match, p1, p2, offset, blah){return(String(Number(p1)*Number(p2)));});
  return(myTerm);
}
function replaceAll(line, regex, replacement)
{
  var lastline;
  while(lastline!=line)
  {
    lastline = line;
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
      lastline = newline;
      //handle a*(b+c) by doing a*(b+c+d+...+n)->a*b+a*(c+..+n). This eventually results in a*b+a*c+...+a*(n-1)+a*(n)
      newline = newline.replace(new RegExp("("+term+"[*])\\(("+term+"[+\\-])"), "$1$2$1(")
      //handle a+/-(b+/-...)-->a+/-b+/-(...)
      newline = newline.replace(new RegExp("("+term+"[+\\-])\\(("+term+"[+\\-])"), "$1$2(");
    }
    newline =replaceAll(newline, new RegExp("([(+\\-]|^)("+num+")([+\\-*/])("+num+")(?=[+\\-)]|$)"), combineNums);//combine numbers
    //handle the artifacts at the end of the previous iterations
    newline = replaceAll(newline, new RegExp("("+term+"[+\\-/*])\\(("+term+")\\)"), "$1$2");
    newline = replaceAll(newline, new RegExp("[/]("+num+")"), divToMul);//if we end up getting a/(num), replace with a*(1/num)
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
  var equ = replaceAll(line, /\s/, "");
  equ = replaceAll(equ, new RegExp("[/]("+num+")"), divToMul);
  equ = replaceAll(equ, /((?:\d*[a-z|A-Z]|\d+))\(/, "$1*(");//x(->x*(
  equ = replaceAll(equ, new RegExp("(\\([^()]*\\))("+term+")"), "$2*$1");
  equ = replaceAll(equ, new RegExp("("+num+")([A-Za-z])"), "$1*$2");
  equ= replaceAll(equ, new RegExp("([+\\-(]|^)([a-zA-Z])"), "$11*$2");
  var expanded = expand(equ);
  //console.log("expanded = "+expanded);
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
    addToLine(ParseTerm(currSideTerms[i]),newline,true);
  }
  currSideTerms = sides[1].split(/(?=[+\-])/);
  for(i = 0;i<currSideTerms.length;i++)
  {
    addToLine(ParseTerm(currSideTerms[i]),newline,false);
  }
  /*for(i=0;i<newline.length;i++)
  {
    console.log(newline[i].id+", " + String(newline[i].value));
  }*/
  lines.push(newline);
}
function genMat()//generate a 2d matrix from lines[]
{
  var columnids = [];
  var rows = [];
  for(i1=0;i1<lines.length;i1++)//init column ids
  {
    for(i2=1;i2<lines[i1].length;i2++)
    {
      var toadd= lines[i1][i2].id;
      var inIdList = false;
      for(i3=0;i3<columnids.length;i3++)
      {
        if(toadd==columnids[i3]){
          inIdList=true;
        }
      }
      if(!inIdList)
      {
        columnids.push(toadd);
      }
    }
  }
  columnids.push("num");//make sure constants are always rightmost column
  for(i1=0;i1<lines.length;i1++)
  {
    var newRow = new Array();
    for(i2=0;i2<columnids.length;i2++)    //initialize newRow
    {
      newRow.push(0);
    }
    for(i2=0;i2<lines[i1].length;i2++)//set proper values in newRow
    {
      var myId = lines[i1][i2].id;
      for(i3=0;i3<columnids.length;i3++)
      {
        if(columnids[i3]==myId)
        {
          newRow[i3]=lines[i1][i2].value;
        }
      }
    }
    rows.push(newRow);
  }
  var myMatrix= new Object();
  myMatrix.values=rows;
  myMatrix.ids = columnids;
  return(myMatrix);
}
function matMult(left, right)
{
  var returnMe = [];
  var leftRows=left.length;
  var leftCols=left[0].length;
  var rightRows = right.length;
  var rightCols =right[0].length;
  if(leftCols!=rightRows)
  {
    console.log("ERR: ATTEMPTED INVLAID MATRIX MULTIPLICATION: "+
  leftRows+"x"+leftCols+" * "+rightRows+"x"+rightCols);
    return(null);
  }
  for(i1=0;i1<leftRows;i1++)
  {
    newRow = [];
    for(i2=0;i2<rightCols;i2++)
    {
      newRow.push(0);
    }
    for(i2=0;i2<rightCols;i2++)
    {
      for(i3=0;i3<leftCols;i3++)
      {
        newRow[i2]+=left[i1][i3]*right[i3][i2];
      }
    }
    returnMe.push(newRow);
  }
  return(returnMe);
}
function genIdentity(size)
{
  ident = [];
  for(i1=0;i1<size;i1++)//init L to an identity matrix
  {
    var newRow=[];
    for(i2=0;i2<size;i2++)
    {
      if(i2==i1){newRow.push(1);}
      else{newRow.push(0);}
    }
    ident.push(newRow);
  }
  return(ident);
}
function nextPivot(matIn, lastpiv, down)
{
  var way = down ? 1:-1;
  var maxC=lastpiv[1]+way;
  var returnRow;
  var returnCol;
  var maxR=lastpiv[0]+way;
  var height = matIn.length;
  var width = matIn[0].length;
  if(((c==width||maxR==height)&&down)||((c==-1||maxR==-1)&&!down))
  {
    //console.log("no good pivot, returning null");
    return(null);
  }
  var done = false;
  if(down){
loop1:
    for(c=maxC;c<width;c++){
loop2:
      for(r=maxR;r<height;r++)
      {
        if(matIn[r][c]==0){
          continue;
        }
        else{
          if(r!=lastpiv[0]+1)
          {
            var rowBuffer=matIn[r].slice(0, width);
            matIn[r]= matIn[lastpiv[0]+1];
            matIn[lastpiv[0]+1]=rowBuffer;
            r=lastpiv[0]+1;
          }
          returnRow = r;
          returnCol = c;
          done = true;
          break loop1;
        }
      }
    }
  }
  else
  {
loop3:
    for(r=maxR;r>-1;r--)
    {
loop4:
      for(c=maxC;c>-1;c--)
      {
        if(matIn[r][c]==0){continue;}
        else if(matIn[r][c]>0||matIn[r][c]<0)
        {
          done = true;
          returnRow = r;
          returnCol = c;
          break loop3;
        }
      }
    }
  }
  if(done){return [returnRow,returnCol,matIn];}
  return(null);
}
function genElim(rREToBe, pivot, down)
{
  var pivotC;
  var pivotR;
  var pivot=nextPivot(rREToBe, pivot, down);
  if(pivot == null){return(null);}
  if(rREToBe!=pivot[2]){rREToBe=pivot[2];}//nextPivot may have to perform row swaps
  pivotR=pivot[0];
  pivotC=pivot[1];
  var height2 = rREToBe.length;
  var elim = genIdentity(height2);
  var direction = down ? 1:-1;
  for(r=pivotR+direction;(r<height2&&r>-1);r+=direction)
  {
    elim[r][pivotR]=-1*(rREToBe[r][pivotC]/rREToBe[pivotR][pivotC]);
  }
  if(!down)
  {
    elim[pivotR][pivotR]= 1/rREToBe[pivotR][pivotC];
  }
  return([elim, rREToBe, [pivotR, pivotC]]);
}
function toRREF(matrixIn)
{
  var height = matrixIn.length;
  var width = matrixIn[0].length;
  var currPiv = [-1,-1];//nextPivot starts with the row underneath and the column to the right of the 'current' one
  var currMatrix= matrixIn;
  //var L = genIdentity(height);
  var currElim;
  var done = false;
  var container;
  while(!done)//bring to upper diagonal form;
  {
    container = genElim(currMatrix, currPiv, true);
    if(container == null){done = true;}
    else
    {
      currElim= container[0];
      currMatrix = container[1];
      currPiv = container[2];
      currMatrix = matMult(currElim, currMatrix);
      //L=matMult(currElim, L);
    }
  }
  done = false;
  currPiv[0]+=1;
  currPiv[1]+=1;
  while(!done)//finish with brute-force gaussian elimination
  {
    container = genElim(currMatrix, currPiv, false);
    if(container == null){done = true;}
    else
    {
      currElim= container[0];
      currMatrix = container[1];
      currPiv = container[2];
      currMatrix = matMult(currElim, currMatrix);
    }
  }
  return(currMatrix);
}
function displayNicely(equns, ids)
{
  var nice=new String("");
  for(i1=0;i1<equns.length;i1++)
  {
    var pivotFound =false;
    for(i2=0; i2<equns[0].length;i2++)
    {
      if(ids[i2]=="num")
      {
        nice = nice.slice(0,-3)+" = "+equns[i1][i2]+"\n";
      }
      else if(equns[i1][i2]!=0)
      {
        if(equns[i1][i2]<0)
        {
          nice= nice.slice(0,-3)+" - "
          if(equns[i1][i2]==-1){nice = nice+ids[i2]+" + ";}
          else{nice = nice + (-1*equns[i1][i2])+ids[i2]+" + ";}
        }
        else {
          if(equns[i1][i2]==1){nice=nice+ids[i2]+" + ";}
          else {nice = nice + equns[i1][i2]+ids[i2]+" + ";}
        }
      }
    }
  }
  return(nice);
}
parse("5+(x+3)+2y +2= 14");
parse("y+x+3=6");
var test = genMat();
console.log(displayNicely(toRREF(test.values), test.ids))
//console.log(toRREF([[1,2,3,1],[4,5,6,1], [1,3,2,4]]));