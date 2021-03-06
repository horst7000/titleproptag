import Box from "./box.js"
import Boxmenu from "./boxmenu.js";
import Saver from "./saver.js"

export default class {
    constructor(collection) {
        this.allboxes   = new Map();
        this.popups     = [{box: document.querySelector(".boxes")}];
        this.JSONcollectionData;
        this.shareid = collection.shareid;

        this.saver = new Saver(collection, this);

        this.menu  = new Boxmenu();
        
        // setInterval(() => {
        //     this.allboxes.forEach((value,key) => console.log(value));
        //     console.log("\n");
        // }, 3000);
    }

    /*
    * gather and provide data
    */
    addBox(box) {
        this.allboxes.set(box.id || box.tmpid, box)
    }

    removeBox(id) {
        this.allboxes.delete(id);
    }
    
    getBox(idOrEl) {
        if(idOrEl instanceof Element || idOrEl instanceof HTMLDocument) {
            return this.getOwningBox(idOrEl)
        } else {
            let box = this.allboxes.get(idOrEl);
            if(!box)
                box = this.fetchGetBox(idOrEl); //TODO not tested
            return box;
        }
    }
    
    requestCollectionData() {
        return this.JSONcollectionData;
    }

    fetchGetBox(id) {     // insert new boxes
        console.log("saving (insert boxes)...");
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
        if(el && el != document.body)
            return this.getBox(el.dataset.id || el.dataset.tmpid) || {box: el}
        else
            return document.body
    }

    getPopupPath() {        
        let ids = this.shareid+"/";
        for (let i = 1; i < this.popups.length; i++) {
            const popupbox = this.popups[i];
            ids += popupbox.id+"/";
        }
        return ids;
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


    /*
    * interaction
    */
    openMenu(box) {
        this.menu.open(box);
    }
    closeMenu() {
        this.menu.hide();
    }

    changeMode(box, mode) { /* changes box mode and mode of children */
        box.mode = mode;
        box.loadContent()
        if(mode != "point") {
            box.propEls.forEach(propBoxEl => {
                let propBox = this.getBox(propBoxEl.dataset.id || propBoxEl.dataset.tmpid);
                this.changeMode(propBox,this.getSmallerModeName(mode))
            })
        }
    }

    prepareForDrop(ev) {
        let owningDefaultBox = ev.related ? this.getOwningBox(ev.related) : this.getOwningBox(ev.from);
        let owningOntopBox;
        let n = -1

        if(owningDefaultBox.mode && owningDefaultBox.mode != "ontop") {
            while(!owningDefaultBox.box.classList.contains("default-box"))
                owningDefaultBox = this.getOwningBox(owningDefaultBox.box.parentNode);
    
            owningOntopBox = this.getOwningBox(owningDefaultBox.box.parentNode);
            n = Array.prototype.indexOf.call(owningOntopBox.propEls, owningDefaultBox.box)
        } else {
            owningOntopBox = owningDefaultBox;
            n = ev.newIndex || ev.oldIndex;
        }

        for (let i = 0; i < owningOntopBox.propEls.length; i++) {
            const defaultBoxSibling = owningOntopBox.propEls[i];
            if(i == n || i == n-1 || i == n+1)
                defaultBoxSibling.querySelectorAll(".props").forEach((el) => {
                    el.classList.add("display-block");
                })
        }
    }
    
    onDropEnd() {
        this.allboxes.forEach(box => {            
            box.propContainer.classList.remove("display-block")            
        });        
    }

}