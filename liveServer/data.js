
// <READING CONFIG>

if (window.location.protocol === 'file:') {
    var hostedIP = '127.0.0.1'
    var hostedPORT = '5000'
    console.log(`Script is being loaded from file system. *Searching for server locally on ${hostedIP}:${hostedPORT}`);
    console.log('Web server is recommend')
} else {
    console.log('Script is being hosted on a web server.');
    var CONFIG;

    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', './config.json', false);
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == 200) {
            CONFIG = JSON.parse(xobj.responseText);
        }
    };
    xobj.send(null);

    // Access configuration properties
    if (CONFIG) {
        var hostedIP = CONFIG.ip;
        var hostedPORT = CONFIG.port;
        console.log(`[Debug]: Server is hosted on ${hostedIP}:${hostedPORT}`);
    } else {
        console.error("Failed to load config.json");
    }
}


// </READING CONFIG>

// <INITAL SETTING>
var overlayContent = document.getElementById("overlay-content")
// </INITAL SETTING>

// <MAIN CODE>
function sendToServer(req, type){
    document.getElementById('SearchIndexFor').value = req
    //const searchVal = document.getElementById("SearchIndexFor").value

    const body = {};
    body[type] = req;

    console.log(body)


    fetch(`http://${hostedIP}:${hostedPORT}/receiver`, 
        {
            method: 'POST', // server only accepts POST
            headers: {
                'Content-type': 'application/json',  // server only accepts application/json
                'Accept': 'application/json'         // server only sends application/json
            },
        // Strigify the payload into JSON
        body:JSON.stringify(body)}).then(res=>{
                if(res.ok){
                    return res.json()
                }else{
                    alert("something is wrong")
                }
            }).then(jsonResponse=>{

            if (type == 'Search'){
                overlayContent.innerHTML = "ICRP-07 Decay Data<br><table id=menuTable></table>"
                overlayContent.id = 'title'
                populateOverlay(
                    jsonResponse['isotopes'],
                    jsonResponse['decaymethods'],
                    jsonResponse['halflife'],
                    jsonResponse['unit']
                )
                toggleOverlay()
                return
            }

            else if (type == 'Info'){
                return(jsonResponse)
            }

            else if (type == 'Chain'){
                localStorage.setItem('chain ' + req, jsonResponse['chain'])
                console.log('Cached chain for Element ' + req)
                populateChainOverlay(jsonResponse['chain'])
                return(jsonResponse)
            }

            else if (type == 'ChainV2'){
                populateChainOverlayBASE64(jsonResponse['b64'])
                return(jsonResponse)
            }

        } 
    ).catch((err) => console.error(err));
}


function getDecayChain(Element){
    cache = localStorage.getItem('chain ' + Element)
    if (cache){
        console.log('Using cached value to build tree for Element ' + Element)
        populateChainOverlay(cache)
    }
    else
    {
        sendToServer(Element, 'Chain')
    }
}


function populateOverlay(inputString, decaymethod, halflife, units){
    if (inputString.length == 0){
        var content = document.createElement('p');
        content.textContent = 'No Data'
        content.onclick = () => {toggleOverlay()}
        overlayContent.appendChild(content)
        
    }
    else
    {
        lines = inputString.split(",")
        method = decaymethod.split(",")
        halflife = halflife.split(",")
        units = units.split(",")

        var menuTable = document.getElementById("menuTable")
        for (let i = 0; i < lines.length; i++){
            var row = menuTable.insertRow(i)
            var tempCell = row.insertCell(0);
            tempCell.innerHTML = "<p onclick=\"toggleChainOverlay(sendToServer(\'" + lines[i] + "\', 'Chain'))\">" + lines[i] + "</p>";
            
            var tempCell = row.insertCell(1)
            
            tempCell.innerHTML = "<p onclick=\"toggleChainOverlay(sendToServer(\'" + lines[i] + "\', 'Chain'))\">" + method[i] + "</p>";

            var tempCell = row.insertCell(2)
            tempCell.innerHTML = "<p onclick=\"toggleChainOverlay(sendToServer(\'" + lines[i] + "\', 'Chain'))\">" + halflife[i] + " " + units[i] + "</p>";
        }
    }
    var closeButton = document.createElement('p');
    closeButton.textContent = "CLOSE"
    closeButton.id = 'closeButton'
    closeButton.onclick = () => {toggleOverlay()}
    overlayContent.appendChild(closeButton)
}

function countString(str, letter) {
    let count = 0;

    // looping through the items
    for (let i = 0; i < str.length; i++) {

        // check if the character is at that position
        if (str.charAt(i) == letter) {
            count += 1;
        }
    }
    return count;
}
// https://www.programiz.com/javascript/examples/check-occurrence-string

var ROOTNODE;
function populateChainOverlay(chain){
    changeFunc()
    clearAll()
 
    chainStr = chain
    // console.log(chainStr)
    chainList = chainStr.split(":::")
    chainList2 = []
    tree = document.getElementById('tree')
    //tree.remove()
    
    for (i = 0; i < chainList.length-1; i++){
        var temp = chainList[i];
        chainList2.push(temp.substring(2, temp.length-2));
        spanElement = document.createElement('span')
        spanElement.class = 'tf-nc'
        spanElement.innerHTML = chainList2[i].replace(/[+]+/g, '').replace(/,/g, '<br>')
        br = document.createElement('br')
        spanElement.appendChild(br)
        depth = countString(chainList2[i], '+')
    
        if (i == 0) // ROOT NODE SPECIFICS
        {
            node = document.createElement('li')
            node.id = chainList2[i]
            node.depth = 0
            node.previousNode = ''
            node.appendChild(spanElement)
            tree.appendChild(node)
            tree.root = chainList2[0]
            tree.depth = 0
        }
        else
        {
            previousDepth = document.getElementById(chainList2[i-1])
            if (depth-1 == previousDepth.depth) // IF THE DEPTH OF THIS NUCLIDE IS ONE MORE THAN THE PREVIOUS NUCLIDE
            {                                   // THEN APPEND THE CURRENT NUCLIDE TO THE PREVIOUS NUCLIDE
                node = document.getElementById(`${chainList2[i-1]}`)

                ul = document.createElement('ul')
                ul.id = `${chainList2[i]}g`
    
                li = document.createElement('li')
                li.id = chainList2[i]
    
                node.depth = depth
                li.depth = depth
                ul.depth = depth
                spanElement.depth = depth
                
                li.appendChild(spanElement)
                ul.appendChild(li)
                node.appendChild(ul)
            }
            else if (depth == previousDepth.depth) // IF THE DEPTH OF THIS NUCLIDE THE SAME AS THE PREVIOUS NUCLIDE
            {                                      // THEN APPEND THE NUCLIDE TO THE SAME NODE AS THE PREVIOUS
                found = false
                j = 1
                
                while (!found)
                {
                    if (document.getElementById(chainList2[i-(j+1)]).depth == depth-1)
                    {
                        found = true
                        node = document.getElementById(`${chainList2[i-(j-1)]}g`)
    
                        li = document.createElement('li')
                        li.id = chainList2[i]
    
                        node.depth = depth
                        li.depth = depth
                        spanElement.depth = depth
    
                        li.appendChild(spanElement)
    
                        node.appendChild(li)
                    }
                    else
                    {
                        j++
                        if (j == 300){
                            found = true
                        }
                    }
                }
            }
            else            // IF THE DEPTH OF THIS NUCLIDE IS NEITHER,
            {               // THEN FIND THE FIRST NUCLIDE TRAVERSING BACKWARDS WITH A DEPTH 1 LESS THAN THE CURRENT, AND APPEND TO IT.
                node = document.getElementById(`${chainList2[i-1]}`)
                found = false
                j = 1
    
                while (!found)
                {
                    if (document.getElementById(`${chainList2[i-j]}`).depth == depth){
                        found = true
                        node = document.getElementById(`${chainList2[i-(j-1)]}g`)

                        li = document.createElement('li')
                        li.id = chainList2[i]
    
                        node.depth = depth
                        li.depth = depth
                        spanElement.depth = depth
                        
                        li.appendChild(spanElement)

                        node.appendChild(li)
                    }
                    else
                    {
                        j++
                        if (j == 300)
                        {
                            found = true
                        }
                    }
                }
            }
        }
    }
}

function populateChainOverlayBASE64(bytes){
    var treeImage = document.getElementById('slowTreeImage')
    if (treeImage){
        treeImage.remove()
    }
    var chainImg = document.createElement('img')
    chainImg.src = `data:image/png;base64,${bytes}`
    chainImg.id = 'slowTreeImage'
    chainImg.onclick = () => {
        var w = window.open("");
        w.document.write(chainImg.outerHTML);
    }
    chainOverlay = document.getElementById('chainImageHolder')
    chainOverlay.appendChild(chainImg)
    tree.style.display = 'none'
}

// List of elements in order for the periodic table.
var elementNames = [
    ['H','','','','','','','','','','','','','','','','','He'],
    ['Li','Be','','','','','','','','','','','B','C','N','O','F','Ne'],
    ['Na','Mg','','','','','','','','','','','Al','Si','P','S','Cl','Ar'],
    ['K','C','Sc','Ti','V','Cr','Mn','Fe','Co','Ni','Cu','Zn','Ga','Ge','As','Se','Br','Kr'],
    ['Rb','Sr','Y','Zr','Nb','Mo','Tc','Ru','Rh','Pd','Ag','Cd','In','Sn','Sb','Te','I','Xe'],
    ['Cs','Ba','La','Hf','Ta','W','Re','Os','Ir','Pt','Au','Hg','Tl','Pb','Bi','Po','At','Rn'],
    ['Fr','Ra','Ac'],
    ['','','','','Ce','Pr','Nd','Pm','Sm','Fu','Gd','Tb','Dy','Ho','Fr','Tm','Yb','Lu'],
    ['','','','','Th','Pa','U','Np','Pu','Am','Cm','Bk','Cf','Es','Fm','Md','No','Lr']
]
// For colours and styling etc
var elementTypes = [
    ['8','','','','','','','','','','','','','','','','','10'],
    ['1','2','','','','','','','','','','','4','8','8','8','9','10'],
    ['1','2','','','','','','','','','','','5','4','8','8','9','10'],
    ['1','2','3','3','3','3','3','3','3','3','3','3','5','4','4','8','9','10'],
    ['1','2','3','3','3','3','3','3','3','3','3','3','5','5','4','4','9','10'],
    ['1','2','3','3','3','3','3','3','3','3','3','3','5','5','5','4','9','10'],
    ['1','2','3'],
    ['','','','','7','7','7','7','7','7','7','7','7','7','7','7','7','7'],
    ['','','','','6','6','6','6','6','6','6','6','6','6','6','6','6','6']
]

// Build periodic table
var table = document.getElementById("periodicTable")

for (let i = 0; i < elementNames.length; i++) {
    var row = table.insertRow(i); // Y axis
    for (let j = 0; j < elementNames[i].length; j++) {
        var tempCell = row.insertCell(j); // X axis
        
        tempCell.id = `t${elementTypes[i][j]}`
        // set tempCell text to the text of its element
        tempCell.innerHTML = elementNames[i][j];
        if (elementNames[i][j] != "") { // add event listener for its own text
            tempCell.addEventListener('click', () => {sendToServer(elementNames[i][j], 'Search')})
        }
    }
}

function toggleTheme() {
    // Check the current background color of the page
    var backgroundColor = window.getComputedStyle(document.body).backgroundColor;

    // Check if the background color is white
    if (backgroundColor === "rgb(255, 255, 255)" || backgroundColor === "#ffffff") {
        localStorage.setItem('theme', 'dark')
        // Change background to black
        document.body.style.backgroundColor = "#1F1F1F";
        document.getElementsByClassName('chainOverlay-container')[0].style.backgroundColor = "#1F1F1F";
        document.getElementById('tree').style.color = "white"

    } else {
        localStorage.setItem('theme', 'light')
        // Change background to white
        document.body.style.backgroundColor = "#ffffff";
        document.getElementsByClassName('chainOverlay-container')[0].style.backgroundColor = "#ffffff";
        document.getElementById('tree').style.color = "black"
    }
}



function toggleOverlay() {
    var overlay = document.getElementsByClassName("overlay-container")[0];
    overlay.style.display = (overlay.style.display === "flex") ? "none" : "flex";
}

function toggleChainOverlay() {
    var overlay = document.getElementsByClassName("chainOverlay-container")[0];
    overlay.style.display = (overlay.style.display === "grid") ? "none" : "grid";
}

document.addEventListener("keydown", handleEscapeKey);

function handleEscapeKey(e) {
    if(e.key === "Escape") {
        var overlay = document.getElementsByClassName("overlay-container")[0];
        // write your logic here.
        overlay.style.display = 'none'

        var overlay = document.getElementsByClassName("chainOverlay-container")[0];
        // write your logic here.
        overlay.style.display = 'none'

        var overlay = document.getElementsByClassName("colorOverlay-container")[0];
        overlay.style.display = 'none'

        var selectBox = document.getElementById("treeSwitcher");
        selectBox.options[selectBox.selectedIndex].value = 'fastTree';
    }
}


// https://www.tutorialspoint.com/how-to-remove-an-added-list-items-using-javascript#:~:text=In%20JavaScript%2C%20we%20defined%20the,method%20to%20remove%20the%20child.

tree = document.getElementById('tree')

function clearAll() {
    while (tree.firstChild) {
    tree.removeChild(tree.firstChild);
    }
 }

 function rgbToHex(rgb) {
    // Separate the RGB components
    var rgbArray = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!rgbArray) return rgb; // return original if not a valid rgb color

    // Convert the components to hexadecimal
    function hex(x) {
        return ("0" + parseInt(x).toString(16)).slice(-2);
    }

    return "#" + hex(rgbArray[1]) + hex(rgbArray[2]) + hex(rgbArray[3]);
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }


function toggleColorOverlay() {
    var overlay = document.getElementsByClassName("colorOverlay-container")[0];
    overlay.style.display = (overlay.style.display === "flex") ? "none" : "flex";
    if (!localStorage.getItem('c1')){
        for (i = 1; i < 11; i++){
            var element = document.getElementById(`t${i}`)
            var backgroundColor = window.getComputedStyle(element).backgroundColor;
            localStorage.setItem(`c${i}`,backgroundColor)
        }
    }
    else
    {    
        for (i = 1; i < 11; i++){
            var tempPicker = document.getElementById(`p${i}`)
            tempPicker.value = rgbToHex(localStorage.getItem(`c${i}`))

        }
    }  
}

function updateColor(id, color){
    elements = document.querySelectorAll(`[id=t${id}]`)
    for (i = 0; i < elements.length; i++){
        elements[i].style.backgroundColor = color
    }
    rgb = hexToRgb(color)
    localStorage.setItem(`c${id}`, `${color}`)
}

function getPickerValue(id){
    return document.getElementById(`p${id}`).value
}

temp = document.getElementById('colorButton')
temp.onclick = () => {toggleColorOverlay()}

for (let i = 1; i < 11; i++){
    const picker = document.getElementById(`p${i}`)
    tempElement = document.getElementById(`t${i}`)

    picker.addEventListener('input', (function(id) {
        return function() {
            updateColor(id, getPickerValue(id));
        };
    })(i));
}

function changeFunc() {
    var selectBox = document.getElementById("treeSwitcher");
    var selectedValue = selectBox.options[selectBox.selectedIndex].value;
    if (selectedValue == 'fastList'){
        tree.style.display = 'flex'
        // if image --> remove it
        var treeImage = document.getElementById('slowTreeImage')
        if (treeImage){
            treeImage.remove()
        }

        // REMOVE ALL CSS FROM TREE ELEMENTS (or remove class name to make it simple)
        // show tree if not there --> don't need to do this yet because tree not removed
        cssTree = document.getElementById('tree')
        // console.log(cssTree)
        cssTree.setAttribute('class','')
        // console.log(cssTree)
    }
    else if (selectedValue == 'slowTree') {
        const roodNodeNoYield = tree.root.split(" ")[0];
        // console.log(roodNodeNoYield)
        sendToServer(roodNodeNoYield, 'ChainV2')
        // delete everything from tree
        // USE radioactivedecay module to build tree,
        // display image from radioactivedecay
    }
    else {
        // selectedValue = 'fastTree'
        tree.style.display = 'flex'
        var treeImage = document.getElementById('slowTreeImage')
        if (treeImage){
            treeImage.remove()
        }

        cssTree = document.getElementById('tree')
        cssTree.setAttribute('class','tree')
        // remove everything and just put tree back.
    }
}

function resetColors(){
    defaultColors = ['ff0000','00ffff','ffff00','556b2f','808080','ff69b4','ffa500','00ff00','800080','ffffff']
    for (let i = 1; i < 11; i++)
    {   
        document.getElementById(`p${i}`).value = `#${defaultColors[i-1]}`
        updateColor(i, `#${defaultColors[i-1]}`)
    }
}

for (i = 1; i < 11; i++)
{
    updateColor(i, localStorage.getItem(`c${i}`))
}

if (localStorage.getItem('theme') == 'dark'){
    toggleTheme()
}
// </MAIN CODE>