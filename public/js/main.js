import Box from "./box.js"   /* module / import needs babel for IE11, UC Browser */
import Boxmgr from "./boxmgr.js" /* https://babeljs.io/docs/en/usage */


const paths             = window.location.pathname.split("/");
const requestedshareid  = paths[1];

let collection          = {shareid: "", defaultboxid: ""};
collection.shareid      = requestedshareid || Math.random().toString(36).substr(2,3);
if(!requestedshareid)
    history.pushState({}, collection.shareid, collection.shareid);

const boxmgr                = new Boxmgr(collection);

let collectionData;

const json = document.querySelectorAll(".json");
for (let i = 0; i < json.length; i++) {
    const p = json[i];
    let data = JSON.parse(p.innerHTML);
    if(data.hasOwnProperty("title"))
        new Box(data, boxmgr);
    else
        collectionData = data;
    p.parentNode.removeChild(p);
}
if(collectionData) {
    const defaultbox = boxmgr.getBox(collectionData.defaultboxid);
    defaultbox.loadContent(document.querySelector(".boxes"));
    collection.defaultboxid = collectionData.defaultboxid;
}
else {
    const defaultbox = new Box({title: "everything"}, boxmgr);
    defaultbox.loadContent(document.querySelector(".boxes"));
    defaultbox.onAddButtonClick();
}

openBoxesInPath();
//setTimeout(() => console.log(boxmgr.allboxes),1000)

/*
*
*             functions
*
*/
function getQueryVariable(variable)
{
       var query = window.location.search.substring(1);
       var vars = query.split("&");
       for (var i=0;i<vars.length;i++) {
               var pair = vars[i].split("=");
               if(pair[0] == variable){return pair[1];}
       }
       return(false);
}

function fetchCollection() {
    const options = { //for fetch
        method: 'GET',
        headers: {"Content-Type": "application/json"}
    }
    fetch('/api/collection/'+requestedshareid, options) // GET
        .then((res) => res.json())
        .then(json => {
            console.log(json);
            defaultbox.loadContent(json.defaultboxid);
            collection.defaultboxid = json.defaultboxid;
        });
}

function openBoxesInPath() {
    let pathids = window.location.pathname.split("/");
    if(pathids.length < 3) // path="/shareid"
        while (boxmgr.popups.length > 1)
            boxmgr.popups[boxmgr.popups.length-1].popUpVanish(true);

    for (let i = 2; i < pathids.length; i++) {
        const id  = pathids[i];
        // cut off different ids from popups (popupVanish)
        while (boxmgr.popups.length > i-1 && boxmgr.popups[i-1].id != pathids[i])
                boxmgr.popups[boxmgr.popups.length-1].popUpVanish(true);
        
        // trailing "/" -> id=""
        if(!id) continue;
        // popup[i-1] == path[i]
        if(boxmgr.popups.length > i-1 && boxmgr.popups[i-1].id == id) continue;

        // open popups from pathids
        boxmgr.getBox(id).popUp(true);
    }
}


/*
 * 
 * 
 *           eventlisteners
 * 
 */
window.addEventListener('keydown', (e) => { 
    if (e.key == 13 || e.keyCode == 13) { // Enter
        e.preventDefault();
        if(e.target.classList.contains("title")) {
            const titleEl = e.target;
            const box     = boxmgr.getBox(titleEl)

            if(box.mode != "point")
                box.onAddButtonClick();
            else
                boxmgr.getBox(box.box.parentNode).onAddButtonClick()                
        }
    }
})

window.onpopstate = (e) => {
    openBoxesInPath();
};