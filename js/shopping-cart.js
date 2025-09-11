// ----------------- SHOPPING CART SCRIPT ----------------- //


// variables used to handle XML files where:
// structShoppingCartXML -> structShoppingCart.xml
// dataComponentsXML -> dataComponenents.xml
// dataLaptopsXML -> dataLeftAndMain.xml
let structShoppingCartXML, dataComponentsXML, dataLaptopsXML;

// variable used to calculate the total price of all items in the shopping cart
let finalTotalPrice = 0;

// ----------------- XML LOADER FOR ITEMS IN THE CART ----------------- //

Promise.all([
    fetch(HTTP_HOST + '/content/structShoppingCart.xml').then(res => res.text()),
    fetch(HTTP_HOST + '/content/dataComponents.xml').then(res => res.text()),
    fetch(HTTP_HOST + '/content/dataLeftAndMain.xml').then(res => res.text()),
    fetch(HTTP_HOST + '/content/compatibilities.json').then(res => res.json())
])
.then(([structShoppingCartXml, dataSideBarXml, dataLaptopsXml, compatibilitiesJson]) => {
    const parser = new DOMParser();

     // Parse XML responses into DOM objects for traversal
    structShoppingCartXML = parser.parseFromString(structShoppingCartXml, "application/xml");
    dataComponentsXML = parser.parseFromString(dataSideBarXml, "application/xml");
    dataLaptopsXML = parser.parseFromString(dataLaptopsXml, "application/xml");

if(cartCount != 0)
{
// ------------------ create DOM elements for the shopping cart page ------------------

    let cartPage = document.createElement("section");
    cartPage.classList.add("cartPage");

    let finalizeStepsBox = document.createElement("section");
    finalizeStepsBox.classList.add("finalizeStepsBox");

    let totalPriceDisplayBox = document.createElement("div");
    totalPriceDisplayBox.classList.add("totalPriceDisplayBox");

    let cartContainer = document.createElement("section");
    cartContainer.classList.add("cartContainer");

    let concreteParent = structShoppingCartXML.querySelector(".itemBox");
    
// ----------------- Handle cookies and build the page based on cookie information -----------------
    getItemCartCookies("cartItems").forEach(itemInCart => 
    {
        let totalLaptopPrice = 0;
        
        let itemBoxClone = concreteParent.cloneNode(true);

        // Clone the <ul> template for this cookie
        let ulClone = tempUlClone = itemBoxClone.querySelector(".specsUl").cloneNode(false);

        // first child of the <ul> element
        let innerChild = itemBoxClone.querySelector(".specsUl").children[0].cloneNode(true);

        // get the cookie name
        let cookieName = itemInCart.match(/^([^=]+)=/)[1];

        itemBoxClone.setAttribute("cookieName", cookieName);
        itemBoxClone = convertXmlToHtml(itemBoxClone);

        // transform the cookie string into an object
        let itemObj = JSONtoObject(itemInCart);

        // array that will keep info about the custom components of each laptop 
        let customComponentsArray = [];

        // select the details inner object from the cookie object
        let detailsObj = itemObj.details;

        // get the currentLaptop object from xml
        let currentLaptop = checkIfLaptopExists(detailsObj, dataLaptopsXML);
        // if it doesn't exist, don't go further
        if(currentLaptop == false) return;

        // a control boolean that will decide if the laptop's cookie has been modified => makes the laptop become unavailable
        let laptopIsOK = true;

        // iterate through keys in 
        for(let key in detailsObj)
        {
            //let cheie = key;
            //let value = detailsObj[key];

            let iconImg = itemBoxClone.querySelector(".imgLaptop");

            if(key=="src")
            {
                iconImg.setAttribute("src", detailsObj[key]);
            }
            else if(key=="customComponents")
            {
                customComponentsArray = detailsObj[key];
            }
            else if(key == "href" || key == "nameOfCookie")
            {
                // if the iterated key is href or nameOfCookie -> skip
                continue;
            }
            else
            {
                if(key == "motherboard")
                {
                    laptopIsOK = (currentLaptop.querySelector("motherboard").textContent == detailsObj[key]);
                    if(laptopIsOK)
                    {
                        totalLaptopPrice += parseFloat(currentLaptop.querySelector("motherboard").getAttribute("price"));
                    }
                }

                if((key != "motherboard") && (key != "name"))
                {
                    let itemComp = currentLaptop.querySelector(key.toLowerCase());

                    // in the case there are multiple components -> normalize the list into 
                    // an array with multiple strings
                    let customizationValuesArr = normalizeComponentValues(detailsObj[key]);

                    customizationValuesArr.forEach(customization =>
                    {
                        // check 1: if component isn't default 
                        if(itemComp.textContent != customization)
                        {
                            
                            // check 2: if the component exists in dataComponents.xml
                            if(checkIfComponentExists(dataComponentsXML, customization))
                            {
                                // check 3: if it's compatible with the mb
                                laptopIsOK = checkCompatibility(compatibilitiesJson, "motherboard", detailsObj["motherboard"], customization);
                                if(laptopIsOK)
                                {
                                        let sections = dataComponentsXML.querySelector("root").children;
                                        for (let i = 0; i < sections.length; i++)
                                        {
                                            let sectionTag = sections[i].tagName;

                                            let nodeList = dataComponentsXML.querySelectorAll(`${sectionTag} > *`);

                                            nodeList.forEach(item => {
                                                let itemName = item.getAttribute("nume");
                                                if(itemName == customization)
                                                {
                                                    totalLaptopPrice += parseFloat(item.querySelector("Price").textContent);
                                                    
                                                }
                                            }); // end forEach item
                                        } // end for i
                                } // end if(laptopIsOK)
                            } // end check 2
                        } // end forEach customization
                        else // the other case where th component is the default one
                        {
                            // check if it passed the first test of the motherboard
                            if(laptopIsOK)
                                totalLaptopPrice += parseFloat(currentLaptop.querySelector(key.toLowerCase()).getAttribute("price"));
                        }
                    }); // end for each customization
                } // end if((key != "motherboard") && (key != "name"))

// ----------------------------------- update DOM elements visually -----------------------------------

                // update the li element to display a customized component
                let liClone = innerChild.cloneNode(true);
                
                liClone.querySelector("strong").innerHTML = key;
                liClone.querySelector("span").innerHTML = detailsObj[key];

                liClone = convertXmlToHtml(liClone);

                if(customComponentsArray.length != 0)
                {
                    itemBoxClone.style.backgroundColor = "#b4d5fb";

                    if(customComponentsArray.includes(key))
                    {
                        liClone.style.backgroundColor = "#E6F2FF";
                        liClone.querySelector("strong").innerHTML = "&#128295; " + key;
                    }
                }

                ulClone.appendChild(liClone);
            } // end else (in checking which key is current)

        }// end for key in detailsObj

        itemBoxClone.querySelector(".specsUl").replaceWith(convertXmlToHtml(ulClone));

        // pass the countDisplay the number of laptops in the cookie
        itemBoxClone.querySelector(".countDisplay").innerHTML = itemObj.itemCount;

        // display the laptop card in the shopping cart if everything is fine
        if(laptopIsOK)
        {
            // append a box that shows the price 
            itemBoxClone.querySelector(".priceDisplayBox").textContent = totalLaptopPrice * itemObj.itemCount + " \u20AC";
            finalTotalPrice += totalLaptopPrice * itemObj.itemCount;
            totalPriceDisplayBox.textContent = "Cart total: " + finalTotalPrice + " \u20AC";

            plusOrMinusItem(itemBoxClone, totalLaptopPrice);
            trashItem(itemBoxClone, totalLaptopPrice);
        }
        else // grey out the laptop card if anything is wrong with it and block all user actions on it 
        {
            itemBoxClone.style.filter = "grayscale(1)";
            itemBoxClone.style.opacity = "0.5";
        }

        // append the individual laptop card to tbe container
        cartContainer.appendChild(itemBoxClone);

    }); // end forEach itemInCart

    // append all DOM elements to the HTML
    document.querySelector("body").appendChild(cartPage);
    cartPage.appendChild(cartContainer);
    cartPage.appendChild(finalizeStepsBox);
    finalizeStepsBox.appendChild(totalPriceDisplayBox);

    let checkoutBtn = document.createElement("button");
    checkoutBtn.classList.add("checkoutBtn");
    checkoutBtn.textContent = "Proceed To Checkout";
    finalizeStepsBox.appendChild(checkoutBtn);

    cartPage.style.paddingTop = getElementHeight("#navigationBar") + "px";

}// end if(cartCount != 0)

    // ----------------- IF THERE IS NO ITEM IN THE SHOPPING CART ----------------- //

    else if(cartCount == 0)
    {
        let canvashtml = document.createElement("canvas");
        document.querySelector("body").appendChild(canvashtml);
        canvashtml.classList.add("canvasHTML");


        drawEmptyShoppingCartPage();

    } // end else if(cartCount == 0)

})//end then
.catch(error => console.error("Error fetching XML files:", error));

// ----------------- LOGIC FOR THE PLUS AND MINUS BUTTONS ----------------- //

function plusOrMinusItem(section, price) 
{
    // ----------------- PLUS BUTTON ----------------- //

    let moreButtons = section.querySelectorAll(".moreButton");
    
    moreButtons.forEach(moreButton => {
        moreButton.addEventListener("click", (e) => {

            // select the element that will display the number of same laptops in the shopping cart
            let countDisplay = moreButton.parentElement.querySelector(".countDisplay");
            // and parse to integer
            let count = Number(countDisplay.innerText);

            finalTotalPrice = finalTotalPrice - price * count;
            
            // increment the number
            count++;
            // modify in the html element
            countDisplay.innerHTML = count;

            // update the price
            let finalPrice = price * count;
            section.querySelector(".priceDisplayBox").textContent = finalPrice + " \u20AC";

            finalTotalPrice = finalTotalPrice + price * count;
            document.querySelector(".totalPriceDisplayBox").textContent = "Cart total: " + finalTotalPrice + " \u20AC";

            // increment the total number of items in the cart
            cartCount++;
            // and modify the text content of the html element that visually displays 
            // the total number of items in the cart
            document.querySelector(".counterDot").textContent = cartCount;

            // select the whole itemBox container
            let container = moreButton.parentElement.parentElement.parentElement;
            // get the cookie name by the attribute of the container
            let cookieName = container.getAttribute("cookiename");

            // select cookie by name
            let cookieString = getCookie(cookieName);
            if (cookieString) 
            {
                // parse the cookie from string to object
                let cartItem = JSONtoObject(cookieString);

                // get the total number of items in the cart by cookie and 
                // parse the value to int
                // + increment the total number of items
                // and set the cookie to the new incremented value
                let totalNoOfItems = parseInt(getCookieValue("cartCount"));
                totalNoOfItems++;
                setCookie("cartCount", totalNoOfItems, 7);

                // modify the cartItem objects's itemCount value
                // and set the cookie with the new value in itemCount
                cartItem.itemCount = count;
                setCookie(cookieName, JSON.stringify([cartItem]), 7);
            }


            let lessButton = moreButton.parentElement.querySelector(".lessButton");
            if(count > 1)
            {
                lessButton.style.color = "#111";
                lessButton.style.cursor = "pointer";
            }
            else
            {
                lessButton.style.color = "#b7b7b7";
                lessButton.style.cursor = "default";
            }
        });// end event listener
    }); // end forEach
    
    // ----------------- MINUS BUTTON ----------------- //

    let lessButtons = section.querySelectorAll(".lessButton");

    lessButtons.forEach(lessButton => {

        let countDisplay = lessButton.parentElement.querySelector(".countDisplay");
        // and parse to integer
        let count = Number(countDisplay.innerText);

        if(count > 1)
            {
                lessButton.style.color = "#111";
                lessButton.style.cursor = "pointer";
            }
            else
            {
                lessButton.style.color = "#b7b7b7";
                lessButton.style.cursor = "default";
            }

        lessButton.addEventListener("click", (e) => {
            // select the element that will display the number of same laptops in the shopping cart
            // and parse to integer
            count = Number(countDisplay.innerText);

            if(count > 1)
            {
                finalTotalPrice = finalTotalPrice - price * count;
                // decrement the number
                count--;
                // modify in the html element
                countDisplay.innerHTML = count;

                 // update the price
                let finalPrice = price * count;
                section.querySelector(".priceDisplayBox").textContent = finalPrice + " \u20AC";

                finalTotalPrice = finalTotalPrice + price * count;
                document.querySelector(".totalPriceDisplayBox").textContent = "Cart total: " + finalTotalPrice + " \u20AC";

                // decrement the total number of items in the cart
                cartCount--;
                // and modify the text content of the html element that visually displays 
                // the total number of items in the cart
                document.querySelector(".counterDot").textContent = cartCount;

                // select the whole itemBox container
                let container = lessButton.parentElement.parentElement.parentElement;
                // get the cookie name by the attribute of the container
                let cookieName = container.getAttribute("cookiename");

                // select cookie by name
                let cookieString = getCookie(cookieName);
                if (cookieString) 
                {
                    // parse the cookie from string to object
                    let cartItem = JSONtoObject(cookieString);

                    // get the total number of items in the cart by cookie and 
                    // parse the value to int
                    // + decrement the total number of items
                    // and set the cookie to the new decremented value
                    let totalNoOfItems = parseInt(getCookieValue("cartCount"));
                    totalNoOfItems--;
                    setCookie("cartCount", totalNoOfItems, 7);

                    // modify the cartItem objects's itemCount value
                    // and set the cookie with the new value in itemCount
                    cartItem.itemCount = count;
                    setCookie(cookieName, JSON.stringify([cartItem]), 7);

                }// end if(cookieString)

                if(count > 1)
                {
                    lessButton.style.color = "#111";
                    lessButton.style.cursor = "pointer";
                }
                else
                {
                    lessButton.style.color = "#b7b7b7";
                    lessButton.style.cursor = "default";
                }

            }// end if(count > 1)

        });// end addEventListener
    }); // end forEach
} // end function

// utilitary function to delete a cookie
function delete_cookie(name) {
    document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

// function that handles processes when an item in the shopping cart is deleted
function trashItem(section, price)
{
    let cancelOrderButtons = section.querySelectorAll(".cancelOrderButton");

    cancelOrderButtons.forEach(cancelOrderButton => {

        cancelOrderButton.addEventListener("click", (e) => {

            // select the whole itemBox container
            let container = cancelOrderButton.parentElement.parentElement;

            // get the cookie name by the attribute of the container
            let cookieName = container.getAttribute("cookiename");

            // select cookie by name
            let cookieString = getCookie(cookieName);

            if (cookieString) 
            {
                // get the total number of items in the cart by cookie and 
                // parse the value to int
                let totalNoOfItems = parseInt(getCookieValue("cartCount"));
                
                // parse the cookie from string to object
                let cartItem = JSONtoObject(cookieString);

                // update the total number of items in the cart to the new value
                // (decrement it with the number of items canceled)
                totalNoOfItems -= cartItem.itemCount;
                document.querySelector(".counterDot").textContent = totalNoOfItems;

                finalTotalPrice = finalTotalPrice - price * cartItem.itemCount;
                document.querySelector(".totalPriceDisplayBox").textContent = "Cart total: " + finalTotalPrice + " \u20AC";

                if(totalNoOfItems == 0)
                {
                    document.querySelector(".counterDot").style.visibility = "hidden";
                    document.querySelector(".cartPage").remove();
                    let canvashtml = document.createElement("canvas");
                    document.querySelector("body").appendChild(canvashtml);
                    canvashtml.classList.add("canvasHTML");
                
                
                    drawEmptyShoppingCartPage();
                }

                // set the cookie for the total number of items in the cart 
                setCookie("cartCount", totalNoOfItems, 7);

                delete_cookie(cookieName);
                
                container.remove();
            } // end if(cookieString) 

        });// end addEventListener

    }); // end forEach
} // end function trashItem



// ----------------- UTILITY FUNCTIONS FOR THE EMPTY SHOPPING CART PAGE ----------------- //

// Resize the canvas to match the current browser window size
function sizeCanvas(canvas) 
{
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Initialize the drawing context with a monospace font
function initFont(ctx, fontSize) 
{
    ctx.font = fontSize + "px monospace";
    ctx.textBaseline = "top"; // Align text to top edge
    ctx.textAlign = "start"; // Align text horizontally to the left
}

// Create an array of "drops" (falling letters), one per column
function createDrops(columns, canvasHeight, fontSize) 
{
    return Array.from({ length: columns }, () =>
    Math.floor(Math.random() * canvasHeight / fontSize)
    );
}

// Reset drops and the "ground" (letters that have landed)
// Also calculates where the message should be centered
function resetDropsAndGround(columns, canvasHeight, fontSize, message) 
{
    const drops = createDrops(columns, canvasHeight, fontSize);                     // Starting positions
    const ground = new Array(columns).fill(null);                                   // Holds landed chars
    const messageCols = Math.max(0, Math.floor((columns - message.length) / 2));    // Message centering
    return { drops, ground, messageCols };
}

// Load an image asynchronously and notify when ready
function loadImage(src, onReady) 
{
    const img = new Image();
    let imageReady = false;

    img.onload = () => 
    {
        imageReady = true;
        onReady(true); // Notify caller that image is ready
    };

    img.onerror = () => console.error("Failed to load image:", src);

    img.src = src;

     // If image is already cached/loaded
    if (img.complete && img.naturalWidth) 
    {
        imageReady = true;
        onReady(true);
    }

    return { img, imageReady };
}

// Recalculate layout when window resizes or content changes
// Determines image size/position and message position
function recalcLayout(canvas, fontSize, imageReady, img, maxImgWidth, 
                    messageLength, resetFn) 
{
    let imgWidth = 0, imgHeight = 0, imgY = 0, messageY = 0;

    // If an image is available, scale it down if needed
    if (imageReady && img && img.width > 0) 
    {
        const scale = Math.min(1, maxImgWidth / img.width);
        imgWidth = img.width * scale;
        imgHeight = img.height * scale;
    }

    const spacing = 20; // Gap between image and message
    const hasImage = imageReady && imgWidth > 0;

    // Total vertical block (image + spacing + message)
    const blockHeight = (hasImage ? imgHeight + spacing : 0) + fontSize;
    const startY = Math.max(0, (canvas.height - blockHeight) / 2);

     // Position image and message
    imgY = startY;
    messageY = hasImage ? imgY + imgHeight + spacing : startY;

    // Reset state (drops + ground) if required
    if (resetFn) resetFn();

    return { imgWidth, imgHeight, imgY, messageY };
}

// Draw a single animation frame
function drawFrame(ctx, canvas, drops, ground, letters, 
    message, messageCols, fontSize, messageY, img, imageReady, 
    imgWidth, imgHeight, imgY) 
{
    // Faint white overlay to create fading trails
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Loop over each column
    for (let i = 0; i < drops.length; i++) 
    {
        const x = i * fontSize;
        const y = drops[i] * fontSize;

         // Check if column overlaps the message area
        const withinMessageCols = i >= messageCols && i < messageCols + message.length;
        const targetChar = withinMessageCols ? message[i - messageCols] : null;

        // If a letter has "landed" (on the ground), draw it in place
        if (ground[i]) 
        {
            ctx.fillStyle = "#174e91";
            ctx.fillText(ground[i], x, messageY);
            continue;
        }

        // Otherwise, draw a random falling letter
        const ch = letters[Math.floor(Math.random() * letters.length)];
        ctx.fillStyle = "#174e91";
        ctx.fillText(ch, x, y);

         // Move the drop downward slowly
        drops[i] += 0.5; // speed

        // When drop reaches message row, "land" it if needed
        if (y >= messageY) 
        {
            if (targetChar) ground[i] = targetChar;  // Lock in correct letter
            drops[i] = Math.floor(Math.random() * -20); // Reset drop above screen
        }
    } // end for

    // Draw image last (on top) centered
    if (imageReady && imgWidth > 0) 
    {
        const imgX = (canvas.width - imgWidth) / 2;
        ctx.drawImage(img, imgX, imgY, imgWidth, imgHeight);
    }
}

// ----------------- Main Page Renderer -----------------
function drawEmptyShoppingCartPage() 
{
    const canvas = document.querySelector("canvas");
    const ctx = canvas.getContext("2d");

    // Animation settings
    const fontSize = 28;
    const letters = "ABCDEFGHIJKLMNOPQRSTUVXYZ".split("");
    const message = "YOUR SHOPPING CART IS EMPTY";
    const maxImgWidth = 300;

    // Initialize canvas and font
    sizeCanvas(canvas);
    initFont(ctx, fontSize);

    // Set up initial state
    let columns = Math.floor(canvas.width / fontSize);
    let { drops, ground, messageCols } = resetDropsAndGround(columns, canvas.height, fontSize, message);

    let img; 
    let imageReady = false;
    let layout;

    // Load mascot image :))
    ({ img } = loadImage("images/russified-tux.png", (ready) => 
    {
        imageReady = ready;
        layout = recalcLayout(canvas, fontSize, imageReady, img, maxImgWidth, message.length, resetState);
    }));

    // Calculate layout initially
    layout = recalcLayout(canvas, fontSize, imageReady, img, maxImgWidth, message.length, resetState);

    // Reset function (called on resize or relayout)
    function resetState() 
    {
        columns = Math.floor(canvas.width / fontSize);
        ({ drops, ground, messageCols } = resetDropsAndGround(columns, canvas.height, fontSize, message));
    }

     // Animation loop
    function animate() 
    {
        drawFrame(ctx, canvas, drops, ground, letters, message, messageCols, fontSize, layout.messageY, img, imageReady, layout.imgWidth, layout.imgHeight, layout.imgY);
        requestAnimationFrame(animate);
    }

    // Handle window resize
    window.addEventListener("resize", () => 
    {
        sizeCanvas(canvas);
        initFont(ctx, fontSize);
        layout = recalcLayout(canvas, fontSize, imageReady, img, maxImgWidth, message.length, resetState);
    });

     // Start animation ---- FINALLY
    requestAnimationFrame(animate);
}


// ------------------------- HANDLE COOKIE CORRECTION IN SHOPPING CART -------------------------

// utiliary function to check if a laptop is customized or default
function checkDefault(href, component, dataLaptopsXml)
{
    let item = dataLaptopsXml.querySelector('laptop[href="' + href + '"] specificatii > ' + component.name );


    return (  item && (component.value == item.textContent.trim().toLowerCase() ) 
                && (component.pret == parseFloat(item.getAttribute("pret")) )  );
}

// utiliary function used to handle logic when a string is from an html
function decodeHtmlEntities(str) 
{
    const txt = document.createElement("textarea");
    txt.innerHTML = str;
    return txt.value;
}

// utiliary function to check if a laptop exists in the xml 
function checkIfLaptopExists(laptopCookie, dataLaptopsXml)
{
    // select the clicked laptop by href, from data xml
    let currentLaptop = dataLaptopsXml.querySelector('laptop[href="' + "/" + laptopCookie.href + '"]');

    if(currentLaptop == null)
    {
        alert("Don't...");
        return false;
    }

    // check if the key "name" in the cookie is the same as the attribute "nume" of the laptop in the dataLaptopssXML 
    if(laptopCookie.name == decodeHtmlEntities(currentLaptop.getAttribute("nume")))
    {
        return currentLaptop;
    }
}

// utiliary function to check if a component exists in the components xml
function checkIfComponentExists(dataComponentsXML, componentValue) {
    let sections = dataComponentsXML.querySelector("root").children;

    for (let i = 0; i < sections.length; i++) {
        let sectionTag = sections[i].tagName;

        let nodeList = dataComponentsXML.querySelectorAll(`${sectionTag} > *`);

        for (let item of nodeList) {
            if (item.getAttribute("nume") == componentValue) {
                return true; // item found
            }
        }
    }

    return false; // nothing matched
}

// utiliary function to handle the cae where there are multiple customizations
// returns each customization as a string in an array of strings
function normalizeComponentValues(compValues) 
{
    return compValues
        .split(/\s*,\s*/)   // split by commas with optional spaces
        .map(s => s.trim()) // remove extra whitespace
        .filter(s => s);    // remove empty strings
}

