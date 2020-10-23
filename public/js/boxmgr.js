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
    
    getBox(id) {
        return this.allboxes.get(id)
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

    /*
    * Save boxes
    */
    addSaver(saver) {
        this.saver = saver;
    }

    onBoxChange(box) {
        this.saver.onBoxChange(box);
    }

    /*
    * interaction
    */
    enlargeBox(fullscreenbox) {
        if(fullscreenbox.mode != "ontop") {
            this.allboxes.forEach(box => {
                if(box.isVisible()) box.setEnlargeFlag();
            });
            // box.loadContent() changes visibility (isVisible())
            // therefore changing mode (enlarge) and loading content needs to be seperated
            this.allboxes.forEach(box => {
                if(box.enlargeFlag) box.enlarge();
                if(box.mode == "prop") box.loadContent(box.id || box.tmpid);
            });
        } else {
            this.allboxes.forEach(box => {
                if(box.isVisible()) {
                    if(box.mode == "ontop") {
                        if(!box.propEls || !box.propEls[0].classList.contains("ontop-box"))
                            box.setShrinkFlag()
                    } else
                        box.setShrinkFlag();
                } 
            });
            this.allboxes.forEach(box => {
                if(box.shrinkFlag) box.shrink();
            });
        }
    }



}