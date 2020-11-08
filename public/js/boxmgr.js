export default class {
    constructor() {
        this.allboxes    = new Map();
        this.JSONstartBoxData    = new Map();
        this.JSONcollectionData;
        
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
        } else
            return this.allboxes.get(idOrEl)
    }

    addData(json) {
        if(json.hasOwnProperty("title"))
            this.JSONstartBoxData.set(json._id, json);
        else
            this.JSONcollectionData = json;
    }

    requestBoxData(id) {
        return this.JSONstartBoxData.get(id);
    }
    
    requestCollectionData() {
        return this.JSONcollectionData;
    }

    getOwningBox(el) {
        while (el && !el.classList.contains("boxes") && !el.classList.contains("box")) {
            el = el.parentNode;
        }
        return this.getBox(el.dataset.id || el.dataset.tmpid) || {box: el}
    }

    getLargerModeName(oldmode) {
        if(oldmode == "ontop")
            return "ontop"
        
        if(oldmode == "default")
            return "ontop"
        
        if(oldmode == "prop")
            return "default"

        if(oldmode == "point")
            return "prop"
    }

    getSmallerModeName(oldmode) {
        if(oldmode == "ontop")
            return "default"
        
        if(oldmode == "default")
            return "prop"
        
        if(oldmode == "prop")
            return "point"

        if(oldmode == "point")
            return "point"
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
    zoomstepToBox(zoomedbox) {
        let zboxmode = zoomedbox.mode;

        if(zoomedbox.mode != "ontop") {
            this.allboxes.forEach(box => {
                if(box.isVisible()) box.setEnlargeFlag();
            });
            // box.loadContent() changes visibility (isVisible())
            // therefore changing mode (enlarge) and loading content needs to be seperated
            this.allboxes.forEach(box => {
                if(box.enlargeFlag) box.enlarge();
                if(box.mode == "prop") box.loadContent();
            });
        } else {
            this.allboxes.forEach(box => {
                if(box.isVisible()) {
                    box.setShrinkFlag();

                    // show ontop boxes which were hidden
                    if(box.ontopLvl == 1)
                        box.loadContent();
                }
            });
            this.allboxes.forEach(box => { // maybe a shrink list like update list in saver(?)
                if(box.shrinkFlag) box.shrink();
            });
        }

        // parallel ontop boxes needs to be hidden otherwise they could get shrunk
        // even if they shouldnt get e.g. they dont contain ontop boxes but they siblings do.

        // hide ontop boxes which do not contain zoomedbox
        if(zboxmode != "ontop") {
            this.allboxes.forEach(box => {
                if( box.isVisible() &&
                    box.mode == "ontop" && 
                    box.ontopLvl == 0 &&
                    !box.contains(zoomedbox.id || zoomedbox.tmpid) &&
                    (!box.id || box.id != zoomedbox.id) &&
                    (!box.tmpid || box.tmpid != zoomedbox.tmpid) )
                        box.hide();
            });
        }
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