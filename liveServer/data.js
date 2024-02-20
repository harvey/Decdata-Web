
var hostedIP = "127.0.0.1"
var hostedPORT = "5000"

// Get the button element --> button
const button = document.getElementById("theButton")

// INITAL SETTING
const x = '' // VARIABLE TO CHANGE FOR SEARCHING -- will rename
const SearchValue = {"Search":x};

// Event listener on the button element -- (with anonymous function)
button.onclick = function(){

    const x = document.getElementById("SearchIndexFor").value
    const SearchValue = {"Search":x};
    
    fetch(`http://${hostedIP}:${hostedPORT}/receiver`, 
        {
            method: 'POST', // important not GET as GET is not a method understood by server.
            headers: {
                'Content-type': 'application/json',  // previously stated from server
                'Accept': 'application/json'         // previously stated from server
            },
        // Strigify the payload into JSON
        body:JSON.stringify(SearchValue)}).then(res=>{
                if(res.ok){
                    return res.json()
                }else{
                    alert("something is wrong")
                }
            }).then(jsonResponse=>{
                // Log the response data in the console
                // // console.log(jsonResponse)
                populateOverlay(jsonResponse['isotopes'], jsonResponse['decaymethods'],
                                jsonResponse['halflife'], jsonResponse['unit'])
                // var content = document.createElement('p');
                // content.textContent = jsonResponse['isotopes']
                // overlayContent.appendChild(content)
                
            } 
            ).catch((err) => console.error(err));
        }

async function getElementInfo(Element){
    const InfoValue = {"Info":Element};
    fetch(`http://${hostedIP}:${hostedPORT}/receiver`, 
        {
            method: 'POST', // important not GET as GET is not a method understood by server.
            headers: {
                'Content-type': 'application/json',  // previously stated from server
                'Accept': 'application/json'         // previously stated from server
            },
        // Strigify the payload into JSON
        body:JSON.stringify(InfoValue)}).then(res=>{
                if(res.ok){
                    return res.json()
                }else{
                    alert("something is wrong")
                }
            }).then(jsonResponse=>{
                // // console.log(jsonResponse)
                //alert(JSON.stringify(jsonResponse))
                return(jsonResponse)
                //populateOverlay(jsonResponse['isotopes'])
                
        } 
    ).catch((err) => console.error(err));
}



function getDecayChain(Element){
    cache = localStorage.getItem('chain ' + Element)
    if (cache){
        console.log('Using cached value to build tree for Element ' + Element)
        populateChainOverlay(cache)
    }
    else{
        const ChainValue = {"Chain":Element};
        fetch(`http://${hostedIP}:${hostedPORT}/receiver`, 
            {
                method: 'POST', // important not GET as GET is not a method understood by server.
                headers: {
                    'Content-type': 'application/json',  // previously stated from server
                    'Accept': 'application/json'         // previously stated from server
                },
            // Strigify the payload into JSON
            body:JSON.stringify(ChainValue)}).then(res=>{
                    if(res.ok){
                        return res.json()
                    }else{
                        alert("something is wrong")
                    }
                }).then(jsonResponse=>{

                    localStorage.setItem('chain ' + Element, jsonResponse['chain'])
                    console.log('Cached chain for Element ' + Element)
                    populateChainOverlay(jsonResponse['chain'])
                    return(jsonResponse)
            } 
        ).catch((err) => console.error(err));
    }
}


function getBase64DecayChain(Element){
    const ChainValue = {"ChainV2":Element};
    fetch(`http://${hostedIP}:${hostedPORT}/receiver`, 
        {
            method: 'POST', // important not GET as GET is not a method understood by server.
            headers: {
                'Content-type': 'application/json',  // previously stated from server
                'Accept': 'application/json'         // previously stated from server
            },
        // Strigify the payload into JSON
        body:JSON.stringify(ChainValue)}).then(res=>{
                if(res.ok){
                    return res.json()
                }else{
                    alert("something is wrong")
                }
            }).then(jsonResponse=>{
                populateChainOverlayBASE64(jsonResponse['b64'])
                return(jsonResponse)
                
        } 
    ).catch((err) => console.error(err));
}

function getElementName(element) { // THIS WAS FOR TESTING PURPOSES WHILE DEFINING THE EVENTLISTENERS
    alert("Element: " + element);
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
            tempCell.innerHTML = "<p onclick=\"toggleChainOverlay(sendToServer(\'" + lines[i] + "\', 'chain'))\">" + lines[i] + "</p>";
            
            var tempCell = row.insertCell(1)
            
            tempCell.innerHTML = "<p onclick=\"toggleChainOverlay(sendToServer(\'" + lines[i] + "\', 'chain'))\">" + method[i] + "</p>";

            var tempCell = row.insertCell(2)
            tempCell.innerHTML = "<p onclick=\"toggleChainOverlay(sendToServer(\'" + lines[i] + "\', 'chain'))\">" + halflife[i] + " " + units[i] + "</p>";
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


var overlayContent = document.getElementById("overlay-content")

function sendToServer(request, type) {
    if (type == 'search'){
        document.getElementById('SearchIndexFor').value = request

        overlayContent.innerHTML = "ICRP-07 Decay Data<br><table id=menuTable></table>"
        overlayContent.id = 'title'
        button.click() // button --> the send 2 python button
        toggleOverlay()
    }
    else if (type == 'info'){
        getElementInfo(request)
    }

    else if (type == 'chain'){
        output = getDecayChain(request)
        return output
    }
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
            tempCell.addEventListener('click', () => {sendToServer(elementNames[i][j], 'search')})
        }
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
    // Remove the 'rgb(' and ')' parts from the input string
    rgb = rgb.slice(4, -1).split(',');

    var r = parseInt(rgb[0]).toString(16).padStart(2, '0');
    var g = parseInt(rgb[1]).toString(16).padStart(2, '0');
    var b = parseInt(rgb[2]).toString(16).padStart(2, '0');

    return "#" + r + g + b;
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
            var element = document.getElementById(`t${i}`)
            var backgroundColor = window.getComputedStyle(element).backgroundColor;
            localStorage.setItem(`c${i}`,backgroundColor)
        }
    }  
}

function updateColor(id, color){
    elements = document.querySelectorAll(`[id=t${id}]`)
    for (i = 0; i < elements.length; i++){
        elements[i].style.backgroundColor = color
    }
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
        getBase64DecayChain(roodNodeNoYield)
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