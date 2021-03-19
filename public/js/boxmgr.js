import Box from "./box.js"
import BoxElementFactory from "./boxelementfactory.js";
import Boxmenu from "./boxmenu.js";
import Saver from "./saver.js"

export default class {
    constructor(collection) {
        this.allboxes   = new Map();
        this.collection = collection;
        
        this.saver = new Saver(collection, this);
        
        this.menu    = new Boxmenu();
        this.factory = new BoxElementFactory(this);
        this._fullscreen = false;
        this.resetPopups();

        // fullscreen & default buttons
        this.fullscBtn = document.createElement("button");
        this.fullscBtn.innerHTML = "&#x26F6;";
        this.fullscBtn.classList.add("closefullscbtn");
        this.closeFullscBtn = document.createElement("button");
        this.closeFullscBtn.innerHTML = "&#x2338;";
        this.closeFullscBtn.classList.add("closefullscbtn");
        this.addFullscreenButton();
    }

    /*
    * gather and provide data
    */
    get latestPopup() {
        return this.popups[this.popups.length-1]
    }

    addBox(box) {
        this.allboxes.set(box.id || box.tmpid, box)
    }
    
    getBox(idOrEl) {
        if(idOrEl instanceof Element || idOrEl instanceof HTMLDocument) {
            return this.allboxes.get(this.getOwningBox(idOrEl).dataset.id)
        } else {
            let box = this.allboxes.get(idOrEl);
            if(!box)
                box = this.fetchGetBox(idOrEl); //TODO not tested
            return box;
        }
    }
    
    fetchGetBox(id) {     // insert new boxes
        console.log("fetch get box");
        const options = { //for fetch
            method: 'GET'
        }
        fetch('/api/box/'+id, options) // GET
            .then((res) => (res.json()))
            .then((json) => {
                return new Box(json, this);
            });
    }

    // get first box containing specific html element
    getOwningBox(el) { // returns box if el is a box itself
        while (el && el != document.body && !el.classList.contains("box")) {
            el = el.parentNode;
        }
        return el
    }

    getPath() {        
        let ids = this.collection.shareid+"/";
        let boxes = document.querySelector(".boxes");
        for (let i = 1; i < boxes.children.length; i++) {
            const ontopbox = boxes.children[i];
            ids += ontopbox.dataset.id+ ((i<boxes.children.length-1) ? "/" : "?full");
        }
        for (let i = 1; i < this.popups.length; i++) {
            const popupbox = this.popups[i];
            ids += popupbox.id + "/";
        }
        return ids;
    }

    resetPopups() {
        this.popups = [{box: document.querySelector(".boxes")}];
    }

    /*
    * Save boxes
    */
    addSaver(saver) {
        this.saver = saver;
    }

    onBoxChange(box) {
        this.saver.onBoxChange(box);
    }

    saveNow(box) {
        this.saver.onBoxChange(box);
        this.saver.save();
    }

    /* Test cases */
    generateTests() {
        this.allboxes.forEach(box => {
            if(Math.random() < 0.5 && box.mode!="ontop") {        
                let newbox = box.createProp();
                newbox.title = "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua"
            }
        })
    }

    isFullscreen() {
        return this._fullscreen;
    }


    /*
    * interaction
    */
    openMenu(box, boxEl) {
        if(box.id != this.collection.defaultboxid)
            this.menu.open(box, boxEl);
    }
    closeMenu() {
        this.menu.hide();
    }

    addFullscreenButton() {
        document.body.append(this.fullscBtn);
        this.fullscBtn.onclick = () => this.fullscreen();
    }
    
    addCloseFullscreenButton() {
        document.body.append(this.closeFullscBtn);
        this.closeFullscBtn.onclick = () => this.closeFullscreen();
    }

    fullscreen() {
        if(this._fullscreen) return;
        this._fullscreen = true;
        this.fullscBtn.remove();
        this.addCloseFullscreenButton();
    }

    closeFullscreen(nohistory = false) {
        this.closeFullscBtn.remove();
        this.addFullscreenButton();
        let topopup = [];
        for (let i = document.querySelector(".boxes").children.length-1; i >= 0; i--) {
            const boxEl = document.querySelector(".boxes").children[i];
            let box = this.getBox(boxEl);
            if(i == 0)
                box.default();
            else {
                box.prop();
                topopup.push(box);
            }
        }
        for (let i = topopup.length-1; i >= 0; i--) {
            const box = topopup[i];
            box.popUp(true);                        
        }
        this._fullscreen = false;
        if(!nohistory)
            history.pushState({}, "eab", "/"+this.getPath());
    }

}