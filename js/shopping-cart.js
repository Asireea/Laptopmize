
let structShoppingCartXML, dataComponentsXML, dataLaptopsXML;

// ----------------- XML LOADER FOR ITEMS IN THE CART ----------------- //

Promise.all([
    fetch(HTTP_HOST + '/content/structShoppingCart.xml').then(res => res.text()),
    fetch(HTTP_HOST + '/content/dataComponents.xml').then(res => res.text()),
    fetch(HTTP_HOST + '/content/dataLeftAndMain.xml').then(res => res.text()),
    fetch(HTTP_HOST + '/content/compatibilities.json').then(res => res.json())
])
.then(([structShoppingCartXml, dataSideBarXml, dataLaptopsXml, compatibilitiesJson]) => {
    const parser = new DOMParser();

    structShoppingCartXML = parser.parseFromString(structShoppingCartXml, "application/xml");
    dataComponentsXML = parser.parseFromString(dataSideBarXml, "application/xml");
    dataLaptopsXML = parser.parseFromString(dataLaptopsXml, "application/xml");

if(cartCount != 0)
{

    let cartContainer = document.createElement("section");
    cartContainer.classList.add("cartContainer");

    let concreteParent = structShoppingCartXML.querySelector(".itemBox");
    
    getItemCartCookies("cartItems").forEach(itemInCart => 
    {
        let totalLaptopPrice = 0;
        //console.log(itemInCart);
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
                //console.log("in if " + key);
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
                //console.log("in else " + key);

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
                                            });
                                        }

                                    
                                    //totalLaptopPrice += parseFloat(currentLaptop.querySelector(key.toLowerCase()).getAttribute("price"));
                                }
                            }
                        }
                        else
                        {
                            if(laptopIsOK)
                            {
                                totalLaptopPrice += parseFloat(currentLaptop.querySelector(key.toLowerCase()).getAttribute("price"));
                            }
                        }
                    }); // end for each customization

                } 

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
            }

            //itemBoxClone.querySelector(".specsUl").replaceWith(ulClone);
        }// end for key in detailsObj

        itemBoxClone.querySelector(".specsUl").replaceWith(ulClone);

        // pass the countDisplay the number of laptops in the cookie
        itemBoxClone.querySelector(".countDisplay").innerHTML = itemObj.itemCount;

        if(laptopIsOK)
        {
            // append a box that shows the price 
            itemBoxClone.querySelector(".priceDisplayBox").textContent = totalLaptopPrice + " \u20AC";

            plusOrMinusItem(itemBoxClone);
            trashItem(itemBoxClone);
        }
        else
        {
            itemBoxClone.style.filter = "grayscale(1)";
            itemBoxClone.style.opacity = "0.5";
        }

        //console.log(totalLaptopPrice);
        // append the individual laptop card to tbe container
        cartContainer.appendChild(itemBoxClone);
        //itemBoxClone = tempItemBoxClone.cloneNode(true);
    }); // end forEach itemInCart

    document.querySelector("body").appendChild(cartContainer);

    cartContainer.style.paddingTop = getElementHeight("#navigationBar") + "px";

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

function plusOrMinusItem(section) 
{
    // ----------------- PLUS BUTTON ----------------- //

    let moreButtons = section.querySelectorAll(".moreButton");
    
    moreButtons.forEach(moreButton => {
        moreButton.addEventListener("click", (e) => {

            // select the element that will display the number of same laptops in the shopping cart
            let countDisplay = moreButton.parentElement.querySelector(".countDisplay");
            // and parse to integer
            let count = Number(countDisplay.innerText);

            // increment the number
            count++;
            // modify in the html element
            countDisplay.innerHTML = count;

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
        });
    });
    
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
            //let countDisplay = lessButton.parentElement.querySelector(".countDisplay");
            // and parse to integer
            count = Number(countDisplay.innerText);

            if(count > 1)
            {
                // decrement the number
                count--;
                // modify in the html element
                countDisplay.innerHTML = count;

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

function delete_cookie(name) {
    document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

function trashItem(section)
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

                if(totalNoOfItems == 0)
                {
                    document.querySelector(".counterDot").style.visibility = "hidden";
                    document.querySelector(".cartContainer").remove();
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

function sizeCanvas(canvas) 
{
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function initFont(ctx, fontSize) 
{
    ctx.font = fontSize + "px monospace";
    ctx.textBaseline = "top";
    ctx.textAlign = "start";
}

function createDrops(columns, canvasHeight, fontSize) 
{
    return Array.from({ length: columns }, () =>
    Math.floor(Math.random() * canvasHeight / fontSize)
    );
}

function resetDropsAndGround(columns, canvasHeight, fontSize, message) 
{
    const drops = createDrops(columns, canvasHeight, fontSize);
    const ground = new Array(columns).fill(null);
    const messageCols = Math.max(0, Math.floor((columns - message.length) / 2));
    return { drops, ground, messageCols };
}

function loadImage(src, onReady) 
{
    const img = new Image();
    let imageReady = false;

    img.onload = () => 
    {
        imageReady = true;
        onReady(true);
    };

    img.onerror = () => console.error("Failed to load image:", src);

    img.src = src;
    if (img.complete && img.naturalWidth) 
    {
        imageReady = true;
        onReady(true);
    }

    return { img, imageReady };
}

function recalcLayout(canvas, fontSize, imageReady, img, maxImgWidth, 
    messageLength, resetFn) 
{
    let imgWidth = 0, imgHeight = 0, imgY = 0, messageY = 0;

    if (imageReady && img && img.width > 0) 
    {
        const scale = Math.min(1, maxImgWidth / img.width);
        imgWidth = img.width * scale;
        imgHeight = img.height * scale;
    }

    const spacing = 20;
    const hasImage = imageReady && imgWidth > 0;
    const blockHeight = (hasImage ? imgHeight + spacing : 0) + fontSize;
    const startY = Math.max(0, (canvas.height - blockHeight) / 2);

    imgY = startY;
    messageY = hasImage ? imgY + imgHeight + spacing : startY;

    if (resetFn) resetFn();
    return { imgWidth, imgHeight, imgY, messageY };
}


function drawFrame(ctx, canvas, drops, ground, letters, 
    message, messageCols, fontSize, messageY, img, imageReady, 
    imgWidth, imgHeight, imgY) 
{
    // Faint white fade to create trails
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Falling letters
    for (let i = 0; i < drops.length; i++) 
    {
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        const withinMessageCols = i >= messageCols && i < messageCols + message.length;
        const targetChar = withinMessageCols ? message[i - messageCols] : null;

        if (ground[i]) 
        {
            ctx.fillStyle = "#174e91";
            ctx.fillText(ground[i], x, messageY);
            continue;
        }

        const ch = letters[Math.floor(Math.random() * letters.length)];
        ctx.fillStyle = "#174e91";
        ctx.fillText(ch, x, y);

        drops[i] += 0.5; // speed

        if (y >= messageY) 
        {
            if (targetChar) ground[i] = targetChar;
            drops[i] = Math.floor(Math.random() * -20);
        }
    } // end for

    // Draw image last (on top)
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


    const fontSize = 28;
    const letters = "ABCDEFGHIJKLMNOPQRSTUVXYZ".split("");
    const message = "YOUR SHOPPING CART IS EMPTY";
    const maxImgWidth = 300;

    sizeCanvas(canvas);
    initFont(ctx, fontSize);

    let columns = Math.floor(canvas.width / fontSize);
    let { drops, ground, messageCols } = resetDropsAndGround(columns, canvas.height, fontSize, message);

    let img; 
    let imageReady = false;
    let layout;

    ({ img } = loadImage("images/russified-tux.png", (ready) => 
    {
        imageReady = ready;
        layout = recalcLayout(canvas, fontSize, imageReady, img, maxImgWidth, message.length, resetState);
    }));

    layout = recalcLayout(canvas, fontSize, imageReady, img, maxImgWidth, message.length, resetState);

    function resetState() 
    {
        columns = Math.floor(canvas.width / fontSize);
        ({ drops, ground, messageCols } = resetDropsAndGround(columns, canvas.height, fontSize, message));
    }

    function animate() 
    {
        drawFrame(ctx, canvas, drops, ground, letters, message, messageCols, fontSize, layout.messageY, img, imageReady, layout.imgWidth, layout.imgHeight, layout.imgY);
        requestAnimationFrame(animate);
    }

    window.addEventListener("resize", () => 
    {
        sizeCanvas(canvas);
        initFont(ctx, fontSize);
        layout = recalcLayout(canvas, fontSize, imageReady, img, maxImgWidth, message.length, resetState);
    });

    requestAnimationFrame(animate);
}


// ------------------------- HANDLE COOKIE CORRECTION IN SHOPPING CART -------------------------

function checkDefault(href, component, dataLaptopsXml)
{
    let item = dataLaptopsXml.querySelector('laptop[href="' + href + '"] specificatii > ' + component.name );


    return (  item && (component.value == item.textContent.trim().toLowerCase() ) 
                && (component.pret == parseFloat(item.getAttribute("pret")) )  );

}

function decodeHtmlEntities(str) 
{
    const txt = document.createElement("textarea");
    txt.innerHTML = str;
    return txt.value;
}

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

function normalizeComponentValues(compValues) 
{
    return compValues
        .split(/\s*,\s*/)   // split by commas with optional spaces
        .map(s => s.trim()) // remove extra whitespace
        .filter(s => s);    // remove empty strings
}

