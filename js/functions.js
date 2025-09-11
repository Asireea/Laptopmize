// ------------------ UTILITY FUNCTIONS ------------------ //

// function to calculate the height of an HTML element
function getElementHeight(selector) 
{
    const element = document.querySelector(selector);

    if (!element) 
        {
        console.warn('Element not found');
        return null;
        }

    const height = element.offsetHeight + topLeftAndMainPadding; // Includes padding + border (but not margin)
    return height;
}

// function to calculate the width of an HTML element
function getElementWidth(selector) 
{
    const element = document.querySelector(selector);
    if (!element) 
        {
        console.warn('Element not found');
        return null;
        }
    
    const width = element.offsetWidth + leftPadding;
    return width;
} 

// formats a string containing a tag and an array of specs for the laptops
function formatTag(str) 
{
    // initalize an empty array that will hold specs
    let specificatiiFilter = [];
    // splits the input string into two parts: main tag and specifications
    let arr = str.split(" [");
    
    // if the string contains specs, puts the specs into an array
    if(arr.length == 2)
    {
        specificatiiFilter = arr[1].slice(0, -1).split(",").map(s => s.trim());
    }
    // returns the main tag and the specs (as array)
    return [arr[0], specificatiiFilter];
}

// function to remove any form of attribute containing "data-js"
// previously used to work with XMLs
function removeDocumentDataJsAttributes()
{
    document.querySelectorAll("body, body *").forEach(node => 
    {
        for (let arg = 0; arg < node.attributes.length; arg++) 
        {
            if (node.attributes[arg].name.search(/^data-js/i) === 0) 
            {
                node.removeAttribute(node.attributes[arg].name);
            } // end-if
        } //end-for
    }); //end forEach
}

// recursively converts an XML DOM node to an equivalent HTML DOM node
// takes the xml node to convert
// returns the html element
function convertXmlToHtml(xmlNode) 
{
    // Create an HTML element using a tag or a default wrapper
    let htmlNode;
    // Text node case
    if (xmlNode.nodeType === Node.TEXT_NODE) {
        return document.createTextNode(xmlNode.nodeValue.trim());
    }
    // Create an HTML element with the same tag name as the XML node
    htmlNode = document.createElement(xmlNode.nodeName);
    // Copy all attributes from the XML node to the HTML element
    for (let attr of xmlNode.attributes || []) {
        htmlNode.setAttribute(attr.name, attr.value);
    }
    // Recursively convert and append all child nodes
    for (let child of xmlNode.childNodes) {
        const converted = convertXmlToHtml(child);
        if (converted) {
            htmlNode.appendChild(converted);
        }
    }
    return htmlNode;
}

// ------------------ RENDERING FUNCTIONS ------------------ //

function setContainerLeft() 
{
    // calculate and style the big specs container so that it has a corresponding width
    const specsPage = document.querySelector("#laptopSpecsPage");
    specsPage.style.left = getElementWidth("#leftContainerLaptopuri") + "px";
}

// utility function used to fill "data-js-attributes" in elements built from xml structures
function fillAttributes(section, laptop) 
{ 
    section.querySelectorAll('[data-js-attributes]').forEach(element => 
    {
        // get the value of 'data-js-attributes' 
        // use split() to turn the string into an array of attribute names
        element.getAttribute("data-js-attributes").split(" ").forEach(attributeName => 
        {
            // For each attribute name, retrieve the corresponding attribute from the <laptop> XML node
            // and set it on the current HTML element
            // Example: if attributeName is "href", set element.setAttribute("href", laptop.getAttribute("href"))
            element.setAttribute(attributeName, laptop.getAttribute(attributeName));
        });//end forEach attributeName
    }); // end forEach element
}

// utility function used to fill "data-js-innerText" in elements built from xml structures
function fillInnerText(section, laptop)
{
    // Set innerText for elements with data-js-innerText
    section.querySelectorAll('[data-js-innerText]').forEach(child => 
    {
        // Get the attribute name from data-js-innerText
        child.innerHTML = laptop.getAttribute(child.getAttribute("data-js-innerText"));
    }); // end forEach child
}

// // utility function used to fill "data-js-iterator" in elements built from xml structures
function processIterators(section, laptop)
{
    // loop through all elements with data-js-iterator
    section.querySelectorAll('[data-js-iterator]').forEach(iterator =>
    {
        // Clone the <ul> template for this laptop
        let ulClone = tempUlClone = iterator.cloneNode(false); // Copy <ul> but no children

        // first child of the <ul> element
        // in this case: <li> element
        let innerChild = tempInnerChildClone = iterator.children[0].cloneNode("true"); // first child
        
        // array with the main tag and the specs child tags
        // in this case: array["specificatii", array[cpu, display, os]]
        let fTag = formatTag(iterator.getAttribute("data-js-iterator"));

        // the element that is the main tag resulted earlier
        // <specificatii>
        //    <cpu></cpu>
        //    <gpu></gpu>
        // etc.
        let dataItem = laptop.querySelector(fTag[0]);
        
        // Case 1: If there are no specific child tags defined 
        // (just the main container tag like <specificatii>)
        if(fTag[1].length == 0)
        {
            // Loop through each child element of <specificatii>
            dataItem.forEach(dataItemChild => 
            {
                // Debugging output to inspect child tag names and their content
                console.log(dataItemChild.nodeName);
                console.log(dataItemChild.innerHTML);
            });
        // Case 2: If specific child tags (like cpu, display, etc.) are provided in data-js-iterator
        } 
        else 
        {
            // Loop through the children of <specificatii>
            for(const dataItemChild of dataItem.children) 
                {
                    // verifying if any of the children of the specs container can be found
                    // in the second array (the allowed list)
                    if(fTag[1].includes(dataItemChild.nodeName))
                    {
                        // clone the <li> template
                        let liClone = tempLiClone = innerChild.cloneNode(true);

                        // Insert the label (e.g., "cpu: ") into the element marked with data-js-item-iterator
                        liClone.querySelector('[data-js-item-iterator="innerText"]').innerHTML = dataItemChild.nodeName + ": ";
                    
                        // Create a plain text node containing the spec value and append it
                        let textNode = document.createTextNode(" " + dataItemChild.innerHTML);
                        liClone.appendChild(textNode);

                         // Append the fully populated <li> to the <ul> clone
                        ulClone.appendChild(liClone);

                    }// end-if
                
            }// end-for of

            let newLi = document.createElement("li");
            newLi.textContent = "Price: " + calcTotalPrice(dataItem) + " \u20AC";
            newLi.classList.add("priceLi");
            ulClone.prepend(newLi);
        }//end-else

        // Replace the original iterator element with the newly built <ul> containing dynamic spec items
        iterator.replaceWith(ulClone);

    });// end-forEach iterator
}

// utility function used to build the specifications of a laptop, from xml
function renderLaptopSpecs(laptopHref, data, struct, compatibilitiesJson)
{
    customComponents = [];

    document.querySelector(".sidebarCloser").click();

    // select the clicked laptop by href, from data xml
    let currentLaptop = data.querySelector('laptop[href="' + laptopHref + '"]');

    // clear previous content of the div container
    //document.querySelector("#laptopSpecsPage").innerHTML = '';

    // ------------------ IMAGE ------------------ //
    // clone the parent container 
    let containerClone = struct.querySelector('#laptopSpecsContainer').cloneNode(true);


    // Fill attributes from current laptop node (like src)
    fillAttributes(containerClone, currentLaptop);

    // ------------------ SPECS ------------------ //

    // build the specifications list by calling the function that builds it
    let specsUlClone = buildIterator(struct, currentLaptop, "specificatii");
    // adds drop holder container to the list
    //addHolderContainer(specsUlClone);
    

    // replace the ul inside the clone with the html ul 
    containerClone.querySelector('ul').replaceWith(convertXmlToHtml(specsUlClone));

    // replace the container from html with the created clone
    // and convert the clone to html 
    document.getElementById("laptopSpecsContainer")
    .replaceWith(convertXmlToHtml(containerClone));

    runCompatibility(compatibilitiesJson);
    //moveLaptopToCart();

}

// utility function used to build the buttons from specs page
function renderSpecsPageButtons(struct)
{
    // clone the buttons container 
    buttonContainerClone = struct.querySelector('.specsPageButtonsContainer').cloneNode(true);

    // get the attribute name from data-js-innerText
    buttonContainerClone.querySelectorAll('[data-js-innerText]').forEach(child => {
        child.innerHTML = child.getAttribute("data-js-innerText");
    });

    document.querySelector(".specsPageButtonsContainer")
    .replaceWith(convertXmlToHtml(buttonContainerClone));

    // create a new div element that will display the price of a laptop near the buttons
    let priceDisplayBox = document.createElement("div");
    priceDisplayBox.classList.add("priceDisplayBox");
    priceDisplayBox.textContent = "Price: " + calcTotalPrice(document.querySelector("#laptopSpecsContainer ul")) + " \u20AC";
    document.querySelector(".specsPageButtonsContainer").prepend(priceDisplayBox);

    //moveLaptopToCart();
    toggleSideBar();

}

function getCenter(imgIconElement)
{
    //---------------------- Get original image's center ----------------------
    
    let imgRect = imgIconElement.getBoundingClientRect();
    
    // get the center coordinates of an image
    return {X: imgRect.left + imgRect.width / 2,
            Y: imgRect.top + imgRect.height / 2};
}

// function to process the animation movement of the little ghost image to the shopping cart icon
function moveLaptopToCart() 
{
    // select the 'add to cart' button
    let addToCartButton = document.querySelector(".addToCartButton");

    // select the specs container because it contains the laptop image
    // and clone it
    let imgContainer = document.querySelector("#laptopSpecsContainer");

    let originalImage = document.querySelector(".mainLaptopIcon");

    centerX = (getCenter(originalImage)).X;
    centerY = (getCenter(originalImage)).Y;

    // add an event to the 'add to cart' button
    addToCartButton.addEventListener("click", (e) => {
        e.preventDefault();

        document.querySelector("#shoppingCartLink").addEventListener("click", addPreventDefault);

        // clone the image
        let imgGhost = originalImage.cloneNode(true);
        
        // toggle a class to the clone
        imgGhost.classList.toggle('mainLaptopIconGhost');

        // append the clone image to the specs container
        imgContainer.appendChild(convertXmlToHtml(imgGhost));

        // add the class "created" to the last element with the class "mainLaptopIconGhost"
        let imageClones = imgContainer.querySelectorAll(".mainLaptopIconGhost");
        let lastImage = imageClones[imageClones.length - 1];
        lastImage.classList.add("created");

        for(let img of imgContainer.querySelectorAll(".mainLaptopIconGhost"))
        {
            if(img.classList.contains("created"))
            {
                // position the ghost image on top of the laptop image and in the middle
                img.style.left = centerX - img.offsetWidth/8 + "px";
                img.style.top = centerY - img.offsetHeight/8 + "px";

                // and make it smaller :))
                img.style.width = "5%";
                
                // start with opacity 1 and transition into opacity 0.5
                img.style.opacity = "0.5";
                img.style.transition = "opacity 2s ease-in-out";

                // select the shopping cart image 
                let shoppingCartImg = document.querySelector('img[alt="Shopping Cart"]');

                // get information about the size of elements and their position
                // relative to the viewport
                // elements: cart image, ghost image
                let cartRect = shoppingCartImg.getBoundingClientRect();
                let imgRect = img.getBoundingClientRect();

                // get the center coordinates of the cart image
                const cartCenter = {
                    x: cartRect.left + cartRect.width/2,
                    y: cartRect.top + cartRect.height/2
                }

                // get the center coordinates of the ghost image
                const imgCenter = {
                    x: imgRect.left + imgRect.width/2,
                    y: imgRect.top + imgRect.height/2
                }

                // get the coordinates at which the ghost image should move
                let deltaX = cartCenter.x - imgCenter.x;
                let deltaY = cartCenter.y - imgCenter.y;

                // after a delay of 2 seconds, move the ghost image to the shopping cart
                setTimeout(() => {
                        img.style.transition = "transform 2s";
                        img.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
                    }, 2000);


                // and finally after 4 seconds, make the image disappear and increase the number
                // of items in the cart
                setTimeout(() => {
                        img.remove();
                        addToCart();
                        document.querySelector("#shoppingCartLink").removeEventListener("click", addPreventDefault);
                },4000);

                img.classList.remove("created");
                img.classList.add("flying");

                
            } // end if -> created
        }// end for img out of countainer
    }); // end event-listener
}// end function moveLaptopToCart

// function to process what happens when an item is added to cart
function addToCart()
{
    // increase the number of items
    cartCount++;
    // select the element that will display the number of items in the cart
    let counterDot = document.querySelector(".counterDot");
    // give text to the element
    counterDot.textContent = cartCount;
    // make the element visible (by default, it's invisible)
    counterDot.style.visibility = "visible";

    setCookie("cartCount", cartCount, 7); // save cookie for 7 days

    addItemToCart();
}

// customizations side-bar processes
function toggleSideBar() 
{
    // select the element that will display the customization menu
    let menu = document.getElementById('customizationMenu');

    // select the button to press to display the customization menu
    let button = document.querySelector(".customizeButton");

    // select the laptop specs page all together
    let laptopSpecsPage = document.querySelector("#laptopSpecsPage");

    // select the naviation bar
    let navBar = document.querySelector("#navigationBar");

    // add an event to the button
    button.addEventListener("click", (e) => {
        e.preventDefault();
        // toggle a class that will make the customization menu visible
        menu.classList.toggle('sidebarVisible');
        // toggle the class that will make the laptop specs page smaller with an animation
        laptopSpecsPage.classList.toggle("laptopSpecsPageSidebarOpen");
        // toggle the class that will make the navigation bar smaller 
        navBar.classList.toggle("navigationBarSidebarOpen");
        
        // display the holders
        document.querySelectorAll(".holderContainer").forEach(holder =>{
            holder.classList.toggle("hideHolder");
        });
        
        setTimeout(() => {
            centerX = (getCenter(document.querySelector(".mainLaptopIcon"))).X;
            centerY = (getCenter(document.querySelector(".mainLaptopIcon"))).Y;

        }, 400);


    });// end eventListener for sidebar open

    // select the arrow image that will close the sidebar
    let sidebarCloser = document.querySelector(".sidebarCloser");

    sidebarCloser.addEventListener("click", (e) => {
        e.preventDefault();
        // hide the sidebar
        menu.classList.remove('sidebarVisible');
        // make the laptop specs page larger again
        laptopSpecsPage.classList.remove('laptopSpecsPageSidebarOpen');
        // make the nav bar larger again
        navBar.classList.remove("navigationBarSidebarOpen");

        // display the holders
        document.querySelectorAll(".holderContainer").forEach(holder =>{
            holder.classList.add("hideHolder");
        });

        setTimeout(() => {
            centerX = (getCenter(document.querySelector(".mainLaptopIcon"))).X;
            centerY = (getCenter(document.querySelector(".mainLaptopIcon"))).Y;
        }, 400);
    });// end eventListener for sidebar closer
}

// ---------------------------- RENDERING THE CUSTOMIZATIONS MENU ---------------------------- //

// builds the component menu from customization page
function buildComponentElement(struct, itemSection)
{
    // clone the menu section from the struct XML along with its children
    let menuSectionClone = struct.querySelector(".menu-section").cloneNode(true);
    menuSectionClone = convertXmlToHtml(menuSectionClone);

    // extract the component name
    const itemName = itemSection[0].tagName;

    buildComponentTitle(menuSectionClone, itemName);

    buildSubmenu(struct, menuSectionClone, itemSection);

    return menuSectionClone;
}

// builds the submenu title of each component group (CPU, GPU, RAM etc.)
function buildComponentTitle(menuSection, componentName)
{
    // set the id of each component group 
    menuSection.setAttribute("id", componentName);

    // select the element that will give the title component
    let titleElement = menuSection.querySelector(".menu-title");

    // clone the title element
    let titleClone = titleElement.cloneNode(true);

    // select the span element and give it the componentName as inner text
    titleClone.querySelector("span").appendChild(
        document.createTextNode(componentName));

    // firstly convert the title clone from XML to HTML 
    titleClone = convertXmlToHtml(titleClone);

    // make the title element call the function toggleMenu on click
    //  with the componentName as a parameter
    titleClone.addEventListener("click", (e) => {
        e.preventDefault();

        // call the function to toggle the submenu
        toggleMenu(componentName);
    });

    // replace the element that will give the component's title
    // with the newly built one
    menuSection.querySelector(".menu-title")
    .replaceWith(titleClone);
}

// function that opens the dropdown submenu of each component menu
function toggleMenu(id) 
{
    // select all component sections
    let allSections = document.querySelectorAll('.menu-section');

    // iterate through the component sections 
    allSections.forEach(section => 
    {
        // removes the "active" class of each section that is not
        // the one found by id
        if (section.id !== id) 
            section.classList.remove('active');
    }); // end forEach

    // select the clicked section by id
    const currentSection = document.getElementById(id);
    // give the active section the class "active"
    currentSection.classList.toggle('active');
}

// build the submenu of each component
function buildSubmenu(struct, menuSection, itemSection)
{
    // select the submenu component
    let submenuClone = menuSection.querySelector(".submenu").cloneNode(true);

    // select the image that will display the component
    // as a template 
    let itemImageTemplate = submenuClone.querySelector(".componentImage");

    // select the tooltip container component template
    // and store it in a varbiable
    let tooltipContentTemplate = submenuClone.querySelector(".tooltip-content");

    // empty the submenuClone in order to build a new one
    submenuClone.innerHTML = '';

    // iterating through the items in an item section
    // for example: in the item section "processors"
    // the items are each <CPU>
    itemSection.forEach(item => {

        // clone the template for image
        let imgClone = itemImageTemplate.cloneNode(true);

        // clone the template for specs table tooltip
        let tooltipClone = tooltipContentTemplate.cloneNode(true);


        // --------------- image setup ---------------
        imgClone.setAttribute("data-id", item.getAttribute("nume"));
        imgClone.setAttribute("data-type", item.tagName);
        imgClone.setAttribute("src", item.getAttribute("src"));
        imgClone.setAttribute("alt", item.getAttribute("nume"));
        imgClone.setAttribute("draggable", "true");
        imgClone.setAttribute("ondragstart", "dragstartHandler(event)");
        
        
        // --------------- component specs setup ---------------

        // select the ul from the tooltip clone
        let specsUl = tooltipClone.querySelector('ul');

        // call the buildIterator in order to build the list of specs on a new clone
        let specsUlClone = buildIterator(struct, item, "specificatii");
        
        // replace the ul from tooltip with the newly built list
        specsUl.replaceWith(convertXmlToHtml(specsUlClone));

        // append the new component image to the submenu
        submenuClone.appendChild(imgClone);

        // append the new tooltip to the submenu
        submenuClone.appendChild(tooltipClone);
    }); // end forEach item

    // replace the submenu in the section with the newly built submenu
    menuSection.querySelector(".submenu")
    .replaceWith(convertXmlToHtml(submenuClone));
}

// helper function that separates the input string into separated words
function splitIntoSeparatedWords(str) 
{
    // Match uppercase letters, including acronyms
    const words = str.match(/([A-Z]+(?=[A-Z][a-z])|[A-Z][a-z]+)/g);
    // If no match (single word), return the original string
    return words ? words.join(' ') : str;
}

/*
    struct - element of xml structure -> html template structure
    item - xml item = data item template
        * e.g. the item is <laptop>
    <root>
        <laptop href="/laptop-apple-macbook-pro-14-2024-cu-procesor-apple-m4-10-nuclee-CPU-10-nuclee-GPU-16gb-512gb-ssd" src="laptop_icons/macbook-pro-14-m4.png" nume="Apple MacBook Pro 14&quot; (M4)">
            <specificatii>
                <cpu>Apple M4 (10‑core)</cpu>
                <gpu>Apple GPU (10‑core)</gpu>
                <ram>16GB</ram>
                <storage>512GB SSD</storage>
                <display>14" Liquid Retina XDR</display>
                <os>macOS</os>
            </specificatii>
        </laptop>

        <laptop></laptop> 
        ...
        <laptop></laptop>
    </root>
*/
function buildIterator(struct, item, iteratorID)
{
    // select the iterator that will display the details, along with its children
    let xmlIterator = struct.querySelector('[data-js-iterator=' + iteratorID + ']');

    // clone the specs ul without its children
    let xmlCloneIterator = tempXmlCloneIterator = xmlIterator.cloneNode(false);
    
    // clone the li element of the selected ul container
    let xmlChildClone = tempXmlChildClone = xmlIterator.children[0].cloneNode("true");

    // array of all children or the selected ones 
    // e.g: array with the main specificatii tag and the specs child tags (if it's the case)
    let selectedChildren = formatTag(xmlCloneIterator.getAttribute("data-js-iterator"));

    // the element that is the main tag resulted earlier
    let dataItem = item.querySelector(selectedChildren[0]);

    // if we are refering to <specificatii> tag alone
    if(selectedChildren[1].length == 0)
    {
        let totalLaptopPrice = 0;
        // iterating through the children of the specs container
        for(const dataItemChild of dataItem.children)
        {
            // clone the <li> element
            let childClone = tempChildClone = xmlChildClone.cloneNode(true);
            
            // select the element with data-js-item-iterator from the clone of <li> element
            // and give it the inner HTML of the name of the node from dataItemChild 
            // e.g. CPU, GPU, DISPLAY etc.
            childClone.querySelector('[data-js-item-iterator="innerText"]').innerHTML = splitIntoSeparatedWords(dataItemChild.nodeName) + ": "; 

            let price = dataItemChild.getAttribute("price");
            childClone.setAttribute("price", price);
            totalLaptopPrice += parseFloat(price);


            let spanNode = document.createElement('span');
            spanNode.appendChild(document.createTextNode(" " + dataItemChild.textContent));
            spanNode.setAttribute("data-initial", dataItemChild.innerHTML);
            childClone.appendChild(spanNode);

            // append the new li element to the ul clone container
            xmlCloneIterator.appendChild(childClone);
            
        }//end for

        xmlCloneIterator.setAttribute("totalLaptopPrice", totalLaptopPrice);

    }//end if

    return xmlCloneIterator;
}

// adds the drop holder container 
function addHolderContainer(iteratedElement, numberOfHolders)
{
    // get the last child of the child element
    let lastChild = iteratedElement.children[iteratedElement.children.length - 1];

    // big container that will hold the holderContainer s
    let overallContainer = document.createElement("section");
    overallContainer.classList.add("containerOfHolders");

    for(let i = 0; i< numberOfHolders; i++)
    {
    
    // create a new div element that will act like a container 
    // for each holder and the cancel button
    let holderContainer = document.createElement('div');

    // add the class toeach new div created
    holderContainer.classList.add("holderContainer", "hideHolder");

    // create a new div element that will be the holder
    // for each dropped element
    let holder = document.createElement('div');

    holder.classList.add("holder"); 
    holder.setAttribute("data-id", "holder");
    holder.setAttribute("ondrop", "dropHandler(event, data, dataSideBar)");
    holder.setAttribute("ondragover", "dragoverHandler(event)");

    // create a new span element to act as a "cancel" button
    let cancelButton = document.createElement('span');
    cancelButton.classList.add("cancelButton");
    // append the text "X" to it 
    cancelButton.appendChild(document.createTextNode("X"));
    // append the holder and the cancel button to the container

    // append the small holder and the cancel button to the holder container
    holderContainer.appendChild(holder);
    holderContainer.appendChild(cancelButton);
    
    // append each holderContainer to the big holder element
    overallContainer.appendChild(holderContainer);
    }

    // append the container to each child element of the ul
    iteratedElement.appendChild(overallContainer);
    
}

// ------------------ FUNCTIONS FOR DRAG AND DROP ACTION ------------------ //

let currentDraggedId = null;
let currentDraggedType = null;
/*
function dragstartHandler(ev) {
    ev.dataTransfer.setData("text", ev.target.getAttribute("data-id"));
    currentDraggedType = ev.target.getAttribute("data-type"); // store globally
}*/

function dragstartHandler(ev) {
    currentDraggedId = ev.target.getAttribute("data-id");   // store ID
    currentDraggedType = ev.target.getAttribute("data-type"); // store type
    ev.dataTransfer.setData("text", currentDraggedId);       // still set ID for drop
}

function dragoverHandler(ev) {
    ev.preventDefault();
    
    if(ev.target.tagName == "DIV" && ev.target.classList.contains("holder"))
    {
        // select the container of the holder element
        let holderContainer = ev.currentTarget.parentElement;

        // select the whole li element
        let specContainer = holderContainer.parentElement.parentElement;

        let draggedElement = document.querySelector(`[data-id="${currentDraggedId}"]`);
        if (!draggedElement) {
            console.warn("No element found for data-id", currentDraggedId);
            return;
        }

        //let draggedElement = document.querySelector(`[data-id="${currentDraggedType.trim()}"]`);
        let clone = draggedElement.cloneNode(true); // clone the image that will be dropped

        // ---------- check incompatibilities ----------

        // select the component name (e.g. "CPU", "GPU", "Motherboard" etc.) from the li element
        let specTypeInContainer = specContainer.querySelector("strong").innerHTML;

        // check if the component name from li and the component name from the dragged image matches
        // and when it doesn't match, it cautions the user by making the holder's border red
        // + a message suggesting "Wrong Type" 
        if(specTypeInContainer.substring(0, specTypeInContainer.length - 1).trim().toLowerCase() 
            != clone.getAttribute("data-type").trim().toLowerCase())
        {
            holderContainer.querySelector(".holder").style.border = "thin solid red";
            holderContainer.querySelector(".holder").innerHTML = "Wrong Type";

            // make the border and message disappear after one second
            setTimeout(() => {
                    holderContainer.querySelector(".holder").style.border = "";
                    holderContainer.querySelector(".holder").innerHTML = "";
            }, 1000);
        }
    }
    else return;
}

function dropHandler(ev, dataLaptop, dataSideBar) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text");

    // select the container of the holder element
    let holderContainer = ev.currentTarget.parentElement;


    // select the whole li element
    let specContainer = holderContainer.parentElement.parentElement;

    let specContainerSpan = specContainer.querySelector("span");

    // select the current dragged element
    let draggedElement = document.querySelector(`[data-id="${data}"]`);
    let clone = draggedElement.cloneNode(true); // clone the image that will be dropped

    // ---------- check incompatibilities ----------

    // select the component name (e.g. "CPU", "GPU", "Motherboard" etc.) from the li element
    let specTypeInContainer = specContainer.querySelector("strong").innerHTML;

    // check if the component name from li and the component name from the dragged image matches
    // and when it doesn't match, it returns the function 
    // -> doesn't let the user drop the image in the selected container
    if(specTypeInContainer.substring(0, specTypeInContainer.length - 1).trim().toLowerCase() 
        != clone.getAttribute("data-type").trim().toLowerCase())
    {
        return;
    }

    // ---------- if it passes the incompatibilities test -> may continue ----------

    // add the class "droppedImg" to the clone of the image
    clone.classList.add("droppedImg");

    clone.setAttribute("draggable", "false"); // prevent dragging the clone
    
    // append the cloned image to the event target
    ev.target.appendChild(clone);

    addToCustomComponents(specTypeInContainer.substring(0, specTypeInContainer.length - 1).trim().toLowerCase());

    // ---------- STYLE VISUAL ELEMENTS ON DROP ----------

    if(specContainer.querySelectorAll(".holderContainer").length > 1)
    {

        if(specContainerSpan.innerHTML == specContainerSpan.getAttribute("data-initial"))
        {
            specContainerSpan.innerHTML = data;
        }
        else
        {
            specContainerSpan.innerHTML += ", " + data;
        }
    }
    else if(specContainer.querySelectorAll(".holderContainer").length == 1)
    {
        // select the inner text of the span element which contains the
        // name of the specified spec
        // and update it to the dropped spec name
        specContainerSpan.innerHTML = data;
    }


    let priceDisplayBox = document.querySelector(".priceDisplayBox");
    let totalLaptopPrice = calcUpdatedPrice(dataLaptop, dataSideBar);

    // update the price in the price display box
    priceDisplayBox.textContent = "Price: " + totalLaptopPrice + " \u20AC";


    // --------------------------- HANDLE CANCEL LOGIC    ---------------------------


    // select the cancel button
    let cancelButton = holderContainer.querySelector(".cancelButton");
    
    // make the cancel button's background red
    cancelButton.style.backgroundColor = "red";

    // add event to the cancel button
    cancelButton.addEventListener("click", e =>
    {
        // remove the cloned image from the holder
        if(holderContainer.querySelector(".holder").firstChild)
        {

            if(specContainer.querySelectorAll(".holderContainer").length > 1)
            {
                // get the data-id (value of the component) of the dropped image clone
                let componentVal = cancelButton.parentElement.querySelector(".droppedImg").getAttribute("data-id");

                // Build a regex: allow optional spaces/commas around the target
                const regex = new RegExp(`\\s*,?\\s*${componentVal}\\s*,?\\s*`);


                // delete the name of the selected component from span
                specContainerSpan.innerHTML = specContainerSpan.innerHTML  
                                                .replace(regex, " ")        // replace match with a space
                                                .replace(/\s+,/g, ",")      // fix cases like " ,"
                                                .replace(/,\s+/g, ", ")     // normalize commas
                                                .replace(/\s+/g, " ")       // collapse spaces
                                                .trim();                    // trim edges

                if(specContainerSpan.innerText == "")
                {
                    // pass the container of the name of the component the initial name
                    let intialValue = specContainerSpan.getAttribute("data-initial");
                    specContainerSpan.innerHTML = intialValue;

                    removeFromCustomComponents(specTypeInContainer.substring(0, specTypeInContainer.length - 1).trim().toLowerCase());
                }
            }
            else if(specContainer.querySelectorAll(".holderContainer").length == 1)
            {
                // pass the container of the name of the component the initial name
                let intialValue = specContainer.querySelector("span").getAttribute("data-initial");
                specContainer.querySelector("span").innerHTML = intialValue;

                removeFromCustomComponents(specTypeInContainer.substring(0, specTypeInContainer.length - 1).trim().toLowerCase());
            }

            // remove the dropped img
            holderContainer.querySelector(".holder").firstChild.remove();

            totalLaptopPrice = calcUpdatedPrice(dataLaptop, dataSideBar);

            priceDisplayBox.textContent = "Price: " + totalLaptopPrice + " \u20AC";
        }

        // make the cancel button seem inactive again by giving it a grey background color
        cancelButton.style.backgroundColor = "#e0e0e0";

    });// end eventListener
}

// ----------------------------- utilitary functions for security -----------------------------

// utility function that checks if components are compatible, according to compatibilities.json
function runCompatibility(compatibilitiesJson)
{
    // html specification items
    document.querySelectorAll("#laptopSpecsContainer ul li").forEach(item => 
        {
            // get the component's name (e.g. CPU, GPU, Motherboard etc.) from the HTML list
            let strongElementFromLi = item.querySelector("strong").innerHTML;
            let componentName = strongElementFromLi.substring(0, strongElementFromLi.length - 1).trim().toLowerCase();
            // get the component's value (e.g. "Intel Core i5‑13420H") from the HTML list
            let componentValue = item.querySelector("span").innerHTML;
            // get the big component from json (e.g. MOTHERBOARD, DISPLAY)
            let comp = compatibilitiesJson[componentName.toUpperCase()];
            if(comp)
            {
                // iterate through each big component and get the values of "items" object
                // e.g. the name of each component ("Apple MSI MEG X670E ACE")
                // and the "dependencies" object
                comp.items.forEach(bigComp =>
                {
                    // iterate through the big component that has the name of the one from li
                    if(bigComp.name != componentValue) return;
                    // iterate through each "dependencies" object and
                    // get the smaller objects 
                    for(let [depComponent, depDetails] of Object.entries(bigComp.dependencies))
                    {
                        // depComponent gets the component name
                        // e.g. CPU, GPU, RAM etc.
                        // depDetails is a component object with multiple properties
                        // e.g. 
                        /*{
                            "customizable": true,
                            "multipleComponents": 1,
                            "values": ["Apple M4 (10‑core)", "Intel Xeon W-3223", "Intel Xeon W-3265M", "Intel Xeon W-3225"]
                            }*/
                        
                        if(depDetails.customizable == true && depDetails.multipleComponents != 0)
                        {
                            // select the strong element from HTML 
                            const targetItem = Array.from(document.querySelectorAll("#laptopSpecsContainer ul li strong"))
                                        .find(strong => strong.textContent.trim() === (depComponent.toLowerCase() + ":"));

                            addHolderContainer(targetItem.parentElement, depDetails.multipleComponents);
                        }


                        // select the div element that holds the component from the sidebar
                        let componentDiv = document.getElementById(depComponent.toUpperCase());

                        // check if the div is valid
                        if(componentDiv)
                        {
                            // select each image element from the div
                            componentDiv.querySelectorAll(".componentImage").forEach(img =>
                                {
                                    // check if the image's data-id -> value of the component
                                    // can NOT be found in the valid values from dependencies
                                    if(!depDetails.values.includes(img.getAttribute("data-id")))
                                    {
                                        // make the image greyed in to appear unavailable
                                        // and cancek its droppable properties
                                        img.setAttribute("draggable", "false");
                                        img.setAttribute("ondragstart", "return false");
                                        img.style.filter = 'grayscale(0.5)';
                                        img.style.opacity = '0.5';
                                    }
                                    // else if it CAN be found in the valid values
                                    else
                                    {
                                        img.setAttribute("draggable", "true");
                                        img.setAttribute("ondragstart", "dragstartHandler(event)");
                                        img.style.filter = '';
                                        img.style.opacity = '';
                                    }
                                });// end forEach img
                        }
                        
                        
                    } // end for-of dependencies
                });// end forEach bigComp
            }// end if(comp)
        }); // end forEach item
}

// utility function that checks if components are compatible, according to compatibilities.json
// but works on idividual components
function checkCompatibility(compatibilitiesJson, parentComp, parentCompName, compToCheck)
{
    // get the big component from json (e.g. MOTHERBOARD, DISPLAY)
    let comp = compatibilitiesJson[parentComp.toUpperCase()];

    // mitigate the case where the comp can not be found
    if(!comp) return false;

    // find the specific parent component (e.g. "Apple MSI MEG X670E ACE")
    let parentItem = comp.items.find(item => item.name === parentCompName);
    // if the specific parent component can not be found -> return false
    if (!parentItem) return false;


    // depComponent gets the component name
        // e.g. CPU, GPU, RAM etc.
        // depDetails is a component object with multiple properties
        // e.g. 
        //   {
        //   "customizable": true,
        //   "multipleComponents": 1,
        //   "values": ["Apple M4 (10‑core)", "Intel Xeon W-3223", "Intel Xeon W-3265M", "Intel Xeon W-3225"]
        //   }

    // iterate through the dependencies for the selected parent component
    // anc check the smaller objects
    for(let [depComponent, depDetails] of Object.entries(parentItem.dependencies))
    {
        // check if the value of the component to check
        // can be found in the valid values from dependencies
        if(depDetails.values.includes(compToCheck)) return true;
    }

    return false;
}

// utilitary function that just adds a preventDefault
function addPreventDefault(e)
{
    e.preventDefault();
}

// ------------------------ COOKIE PROCESSING FUNCTIONS ------------------------

// Helper function to set a cookie
function setCookie(name, value, days) 
{
    let expires = "";
    if (days) 
    {
        let date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000)); // expiry in days
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + value + expires + "; path=/";
}

// helper function to get only the value of a cookie (the part after "="), by cookie name
function getCookieValue(name)
{
    if(getCookie(name))
        return getCookie(name).split("=")[1];
    else return null;
}

// Helper function to get a cookie by name (returns "name=value")
function getCookie(name) {
    // Build the string we want to search for, e.g. "cartItems="
    let nameEQ = name + "=";

    // Get all cookies from document.cookie and split them into an array
    let ca = document.cookie.split(';');

    // Loop through each cookie in the array
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i].trim();

        if (c.indexOf(nameEQ) === 0) {
            // Return full "name=value" so JSONtoObject can parse it
            return name + "=" + c.substring(nameEQ.length, c.length);
        }
    }

    // If no cookie with the given name is found, return null
    return null;
}

// utilitary function that processes the cookie for each item added to cart
function addItemToCart()
{
    let specsPageParent = document.querySelector("#laptopSpecsPage");
    let laptopIcon = specsPageParent.querySelector(".mainLaptopIcon");

    // get the product link for the href in the cookie
    const pathParts = window.location.pathname.split("/");
    const productLink = pathParts[pathParts.length - 1];

    // array of cookies with the name containing the input string
    let cartItems = sortCookiesByName(getItemCartCookies("cartItems"));

    // get the next name of cookie
    let nameOfCookie = "cartItems" + (getLastCartIndex(cartItems) + 1);

    // create a new cookie object
    let itemCookie = 
    {
        itemCount: 1,
        details:
        {   
            href: productLink,
            src: laptopIcon.getAttribute("src"),
            name: laptopIcon.getAttribute("nume"),
            customComponents: customComponents,

        }
    }

    // populate the rest of the cookie object with the laptop specs from the html
    document.querySelectorAll("#laptopSpecsContainer ul li").forEach(item => 
        {
            // get the component's name (e.g. CPU, GPU, Motherboard etc.) from the HTML list
            let strongElementFromLi = item.querySelector("strong").innerHTML;
            let componentName = strongElementFromLi.substring(0, strongElementFromLi.length - 1).trim().toLowerCase();
            // get the component's value (e.g. "Intel Core i5‑13420H") from the HTML list
            let componentValue = item.querySelector("span").innerHTML;

            itemCookie.details[componentName] = componentValue;
        });


        // iterate through the array of existent cookies
        for(let cartItem of cartItems)
        {
            // JSON-ify the current cookie from the array
            let jsonCookieObject = JSONtoObject(cartItem);

            // check if the current cookie from the array is the same as the new cookie object
            // without the attribute nameOfCookie from the current iterated cookie
            // because the new cookie object doesn't have "nameOfCookie" attribute yet
            if(    compareObjects(  itemCookie.details, withoutCookieName(jsonCookieObject.details) )    )
            {
                // if they are the same, increase the item count on the new cookie object
                // take the itemCount of the found equal cookie, increase it first
                // and pass it to the new cookie object 
                itemCookie.itemCount = ++jsonCookieObject.itemCount;
                // and set the global variable "nameOfCookie" to the old name of the found cookie from array
                nameOfCookie = jsonCookieObject.details.nameOfCookie;

                // and break out of for
                break;
            }
            
        } // end for

        // set the attribute nameOfCookie on the new cookie object
        itemCookie.details.nameOfCookie = nameOfCookie;
        // use the new cookie object and the nameOfCookie 
        // to set a new cookie for the browser
        setCookie(nameOfCookie, JSON.stringify([itemCookie]), 7);

}// end addItemToCart

// remove the attribute "nameOfCookie" from the current object
function withoutCookieName(obj)
{
    let clone = {...obj};
    delete clone.nameOfCookie;

    return clone;
}

// A helper function to get the number after "cartItems"
function getCartIndex(str) 
{
    // ^ means "start of string", (\d+) means "one or more digits"
    const match = str.match(/^cartItems(\d+)=/);

    // return that number (or 0 if not found)
    return match ? Number(match[1]) : 0;      
}

// function to sort the cookies
function sortCookiesByName(cookieArray) 
{
    return cookieArray
    .sort((a, b) => getCartIndex(a) - getCartIndex(b));
}

// function to get the index of last cookie set
function getLastCartIndex(cookieArray)
{
    if(cookieArray.length == 0)
        return 0;

    return getCartIndex(cookieArray[cookieArray.length - 1]);
}


// returns true if the objects are equal 
// or false if the objects are not equal
function compareObjects(obj1, obj2) {return JSON.stringify(obj1) === JSON.stringify(obj2);}


//splits the document's cookies into an array
//then filters out only the ones that include the given cookieName parameter
function getItemCartCookies(cookieName) {return document.cookie.split("; ").filter(str => str.includes(cookieName));}

// utilitary function to transform a json-format to a object that can be used
function JSONtoObject(stringToTransform)
{
    let objName = stringToTransform.match(/^([^=]+)=/)[1];

    // Remove the `cartItems=` part
    let jsonStr = stringToTransform.replace(objName + "=", "");

    // Parse into object
    return JSON.parse(jsonStr)[0];
    
    // Extract details
    //let details = cartItems[0].details;
}

// utilitary function to manipulate the customComponents array
function addToCustomComponents(item)
{
    if(! customComponents.includes(item)) 
        customComponents.push(item);
}

function removeFromCustomComponents(item)
{
    customComponents = customComponents.filter(value => value !== item);
}

// Calculate the total price of all elements with a "price" attribute within a given parent item
function calcTotalPrice(item) {
    // 'item' is the parent element containing child elements with a "price" attribute

    let totalPrice = 0;

    // Loop through all children that have a "price" attribute
    item.querySelectorAll('[price]').forEach(priceItem => {
        // Get the value of the "price" attribute
        let price = priceItem.getAttribute("price");

        // Convert it to a float and add it to the total
        totalPrice += parseFloat(price);
    });

    // Return the sum of all prices
    return totalPrice;
}

// Get the laptop data from an XML document that corresponds to the current page URL
function getCurrentLaptopByHref(dataLaptopsXml)
{
    // Extract the last segment of the URL path as the product identifier
    // Example: where https://example.com/laptop-lenovo-ideapad-slim-5-14irh10-i5-13420h-32gb-1tb
    // the extracted part is: "laptop-lenovo-ideapad-slim-5-14irh10-i5-13420h-32gb-1tb"

    const pathParts = window.location.pathname.split("/");
    const productLink = pathParts[pathParts.length - 1]; // laptop-lenovo-ideapad-slim-5-14irh10-i5-13420h-32gb-1tb

    let dataLaptop;

    // Loop through all <laptop> elements in the XML
    dataLaptopsXml.querySelectorAll("laptop").forEach(laptop => {
        let laptopHref = laptop.getAttribute("href");

         // Check if the href (without leading "/") matches the product identifier from URL
        if(laptopHref.substring(1) == productLink)
        {
            dataLaptop = laptop; // Store the matching laptop
            return; // exit forEach early 
        }
    });

    return dataLaptop; // Return the matching laptop element, or undefined if not found
}

// Get the XML node corresponding to a customization component dropped by the user
function getCurrentCustomization(dataCustomComponentsXml, droppedComp)
{
    let dataCustomization;

    // Get all direct children of <root> in the XML
    let sections = dataCustomComponentsXml.querySelector("root").children;

    // Loop through each section (e.g., CPU, GPU, RAM, STORAGE etc.)
    for (let i = 0; i < sections.length; i++)
    {
        let sectionTag = sections[i].tagName;

        // Get all items in the xml that builds the sidebar, that belong to the current section
        let nodeList = dataSideBar.querySelectorAll(`${sectionTag} > *`);

        nodeList.forEach(item => {
            // Compare each item's "nume" attribute to the data-id of the dropped component
            let itemName = item.getAttribute("nume");
            if(itemName == droppedComp.getAttribute("data-id"))
            {
                dataCustomization = item; // Store the matching customization
                return; // exit forEach early 
            }
        });
    }

    return dataCustomization; // Return the matching customization node, or undefined if not found
}


/*
case 1: the <li> element has only one holder and holder is empty
case 2: the <li> element has only one holder and holder has an image
case 3: the <li> element has more holders and all are empty
case 4: the <li> element has more holders and at least one has an image
case 4: the <li> element has no holders
*/
// utilitary function that updates the price, upon customization made
function calcUpdatedPrice(dataLaptop, dataCustomComponentsXml)
{
    let currentLaptop = getCurrentLaptopByHref(dataLaptop);

    let totalLaptopPrice = 0;

    // iterate through each li element of the specs page ul
    document.querySelectorAll("#laptopSpecsContainer ul li").forEach(liElement =>
    {
        // case 1 & 2: the current <li> has one holder
        if(liElement.querySelectorAll(".holder").length == 1)
        {
            // case 2: the holder has one droppedImg child
            // check if the current holder contains children in order to determine 
            // if it contains at least one image
            if(liElement.querySelector(".holder").children.length > 0)
            {
                // select the child droppedImg
                let childImg = liElement.querySelector(".droppedImg");

                // select the current customization by looking at the dropped image, against the components XML
                let currentCustomization = getCurrentCustomization(dataCustomComponentsXml, childImg);
                
                // mitigate the case where the user modifies the data-id and the currentCustomization will come out undefined or null
                if(currentCustomization == null)
                {
                    alert("Stop playing!!");
                    location.reload();
                }

                // get tthe price of the customization from XML
                let currentCustomizationPrice = parseFloat(currentCustomization.querySelector("Price").textContent);
                // increment the total laptop price
                totalLaptopPrice += currentCustomizationPrice;
            } // end if(liElement.querySelector(".holder").children.length > 0)

            // case 1: the holder is empty
            // use initial comp for the price
            else
            {
                // select the component name (e.g. "CPU", "GPU", "Motherboard" etc.) from the li element
                let specTypeInContainer = liElement.querySelector("strong").innerHTML;
                // clean up the spec type from html
                let cleanSpecType = specTypeInContainer.substring(0, specTypeInContainer.length - 1).trim().toLowerCase();
                // get the price of the initial component
                let initialCompPrice = parseFloat(currentLaptop.querySelector(cleanSpecType).getAttribute("price"));

                // increment the total price
                totalLaptopPrice += initialCompPrice;
            } // end else
        } // end if(liElement.querySelectorAll(".holder").length == 1)
        
        // case 3 & 4: the current <li> has more holders
        else if(liElement.querySelectorAll(".holder").length > 1)
        {
            let hasAtLeastOneCustomization = false;
            // iterate through each holder if the current <li> element
            liElement.querySelectorAll(".holder").forEach(holder => {
                // case 4: multiple holders but at least one has an img
                // check if the holder contains one droppedImg
                if(holder.querySelector(".droppedImg"))
                {
                    hasAtLeastOneCustomization = true;
                    // select the child droppedImg
                    let childImg = holder.querySelector(".droppedImg");

                    // select the current customization by looking at the dropped image, against the components XML
                    let currentCustomization = getCurrentCustomization(dataCustomComponentsXml, childImg);

                    // mitigate the case where the user modifies the data-id and the currentCustomization will come out undefined or null
                    if(currentCustomization == null)
                    {
                        alert("Stop playing!!");
                        location.reload();
                    }

                    // get tthe price of the customization from XML
                    let currentCustomizationPrice = parseFloat(currentCustomization.querySelector("Price").textContent);
                    // increment the total laptop price
                    totalLaptopPrice += currentCustomizationPrice;
                }
            }); // end for each holder

            // case 3: multiple holder but all are empty
            // total will be the price of the inital component only once
            if(hasAtLeastOneCustomization == false)
            {
                // select the component name (e.g. "CPU", "GPU", "Motherboard" etc.) from the li element
                let specTypeInContainer = liElement.querySelector("strong").innerHTML;
                // clean up the spec type from html
                let cleanSpecType = specTypeInContainer.substring(0, specTypeInContainer.length - 1).trim().toLowerCase();
                // get the price of the initial component
                let initialCompPrice = parseFloat(currentLaptop.querySelector(cleanSpecType).getAttribute("price"));

                // increment the total price
                totalLaptopPrice += initialCompPrice;
            } // end if(hasAtLeastOneCustomization == false)
            
        }// end else if(liElement.querySelectorAll(".holder").length > 1)
        
        // case 5: there is no holder and the current <li> element
        // will use the price of the initial component
        else 
        {
            // select the component name (e.g. "CPU", "GPU", "Motherboard" etc.) from the li element
            let specTypeInContainer = liElement.querySelector("strong").innerHTML;
            // clean up the spec type from html
            let cleanSpecType = specTypeInContainer.substring(0, specTypeInContainer.length - 1).trim().toLowerCase();
            
            // get the price of the initial component
            let initialCompPrice = parseFloat(currentLaptop.querySelector(cleanSpecType).getAttribute("price"));
            
            // increment the total price
            totalLaptopPrice += initialCompPrice;
        } // end else
    }); // end for each liElement

    return totalLaptopPrice;
}

