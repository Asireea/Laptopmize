
//const HTTP_HOST = "http://localhost/laptopmize";
//const HTTP_HOST = "http://laptopmize.asireea.com";

let customComponents = [];

// center coords of image
let centerX, centerY;

// variables used to handle XML files where:
// data -> dataLeftAndMain.xml
// struct -> structLeftAndMain.xml
// dataSideBar -> dataComponents.xml
// structSideBar -> structComponents.xml
let data, struct, dataSideBar, structSideBar;

// ------------------ PAGE LAYOUT UTILITY ------------------ //

    ['load', 'resize'].forEach(function(event) { window.addEventListener(event, setContainerLeft)});

    // calculate and style the big leftAndMain container so that it has a top padding
    const leftAndMainContainer = document.querySelector("#leftAndMain");
    leftAndMainContainer.style.paddingTop = getElementHeight("#navigationBar") + "px";

    document.querySelector(".laptopPage").style.top = getElementHeight("#navigationBar") + "px";

// ----------------- XML LOADER FOR LAPTOP CARDS AND SPECS MENU ----------------- //
// ----------------- XML LOADER FOR CUSTOMIZATION MENU ----------------- //


// load the xml files for laptop cards and specs menu
Promise.all([
  fetch(HTTP_HOST + '/content/dataLeftAndMain.xml').then(res => res.text()),
  fetch(HTTP_HOST + '/content/structLeftAndMain.xml').then(res => res.text()),
  fetch(HTTP_HOST + '/content/dataComponents.xml').then(res => res.text()),
  fetch(HTTP_HOST + '/content/structComponents.xml').then(res => res.text()),
  fetch(HTTP_HOST + '/content/compatibilities.json').then(res => res.json())
])
.then(([dataXml, structXml, dataSideBarXml, structSideBarXml, compatibilitiesJson]) => {
  //console.log(compatibilitiesJson);
  const parser = new DOMParser();

  // Parse XML strings into DOM structures for the left and specs pages
  data = parser.parseFromString(dataXml, "application/xml");
  struct = parser.parseFromString(structXml, "application/xml");
  
  // Parse XML strings into DOM structures for the side bar page
  dataSideBar = parser.parseFromString(dataSideBarXml, "application/xml");
  structSideBar = parser.parseFromString(structSideBarXml, "application/xml");
  
  // Get the laptop section structure template from struct XML
  let concreteParentIterator = struct.querySelector('[data-js-parent-iterator="laptop"]');
  let laptopSectionClone = tempLaptopSectionClone = concreteParentIterator.cloneNode("true");

  // Get the current URL path to match laptop hrefs
  const laptopLinkHref = window.location.href.replace(HTTP_HOST, '');
  //const laptopLinkHref = HTTP_HOST;
  // the laptop specs container that we will check
  const divToCheck = document.getElementById("laptopSpecsContainer");
  
  // ---------------------- LEFT LAPTOP CARDS ---------------------- //
  // Iterate through all <laptop> nodes in data XML
  data.querySelectorAll("laptop").forEach(laptop => 
  {
    
      // Clone the laptop section template for each laptop
      laptopSectionClone = tempLaptopSectionClone.cloneNode("true");
      fillAttributes(laptopSectionClone, laptop);
      fillInnerText(laptopSectionClone, laptop);
      processIterators(laptopSectionClone, laptop);
      // Append the final, fully prepared laptop section (laptopSectionClone) into the correct parent container in the DOM
      // - concreteParentIterator comes from the <struct> XML and represents the laptop template
      // - concreteParentIterator.parentNode.id gives us the ID of the actual DOM container where laptops should be added
      // - convertXmlToHtml(...) converts the XML structure (with updated values) into real HTML DOM elements
      // - appendChild(...) inserts the laptop section into the page under that container
      document.getElementById(concreteParentIterator.parentNode.id)
      .appendChild(convertXmlToHtml(laptopSectionClone));
  });// end forEach laptop

  // ----------------- XML LOADER FOR CUSTOMIZATION MENU ----------------- //

  // get the parent section that will contain the component menus
  let componentsContainer = document.querySelector(".componentsContainer");
  componentsContainer.innerHTML = '';

  let sections = dataSideBar.querySelector("root").children;

  for (let i = 0; i < sections.length; i++)
  {
    let sectionTag = sections[i].tagName;

    let nodeList = dataSideBar.querySelectorAll(`${sectionTag} > *`);

    componentsContainer.appendChild( buildComponentElement(structSideBar, nodeList) );
  }

  // ---------------------- EVENT LOGIC ---------------------- //
        document.querySelectorAll(".laptop-container a").forEach(selectedA =>{
            let targetHref = selectedA.getAttribute("href");
            //console.log(selectedA, targetHref);
            
            selectedA.addEventListener("click", (e) => {
                e.preventDefault();

                //console.log(laptop);
                history.pushState(null, '', HTTP_HOST + targetHref);
                //console.log(HTTP_HOST + targetHref);
                
                renderLaptopSpecs(targetHref, data, struct, compatibilitiesJson);
                renderSpecsPageButtons(struct);
                moveLaptopToCart();
                //toggleSideBar();
                
            });//end-event-listener
        });// end forEach (for the selectedA)



  // Check if laptop specs are already displayed
  // (no <ul> means we haven't loaded specs yet)
  if(laptopLinkHref != "/" && !(divToCheck.querySelector('ul')))
  {
    //console.log(laptopLinkHref);
    renderLaptopSpecs(laptopLinkHref, data, struct, compatibilitiesJson);
    renderSpecsPageButtons(struct);
    moveLaptopToCart();
    //toggleSideBar();
  } 


})// end then

.catch(error => console.error("Error fetching XML files:", error));


