//const HTTP_HOST = "http://localhost/laptopmize";
const HTTP_HOST = "http://laptopmize.asireea.com";

// ---------------------- CONSTANTS ---------------------- //
// padding constant used when calculating layout dimensions
const topLeftAndMainPadding = 10;
// padding constant used for adding padding to the left between
// laptop cards and laptop specs page
const leftPadding = 10;
// number of elements in the shopping cart
// Initialize cartCount from cookie (default 0 if not set)
let cartCount = parseInt(getCookieValue("cartCount")) || 0;
//console.log(getCookieValue("cartCount"));

window.addEventListener("pageshow", function(event) {
  if (event.persisted) {
    // Page was loaded from bfcache, force reload to get fresh cookies
    window.location.reload();
  } 
});



// Update the cart counter UI on page load
let counterDot = document.querySelector(".counterDot");



if (cartCount > 0) 
{
    counterDot.textContent = cartCount;
    counterDot.style.visibility = "visible";
}

//const shoppingCartLink = HTTP_HOST + "/shopping-cart";

const currentUrl = new URL(window.location.href);

let page = "main";

if(currentUrl.origin + currentUrl.pathname === HTTP_HOST + "/shopping-cart")
{
    page = "shopping-cart";
    document.querySelectorAll("body > *").forEach(child => {
        if(!(child === document.querySelector("#navigationBar") || child.tagName === "SCRIPT"))
        {
            document.querySelector("body").removeChild(child);
        }
    });
}
let pageScript = document.createElement("script");
pageScript.src = "js/" + page + ".js";
document.body.appendChild(pageScript);

setTimeout(() => {
    removeDocumentDataJsAttributes();
}, 2000);
