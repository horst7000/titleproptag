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
    enlargeBox(enlargingbox) {
        let enboxmode = enlargingbox.mode;

        if(enlargingbox.mode != "ontop") {
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

        // hide ontop boxes which do not contain enlargingbox
        if(enboxmode != "ontop") {
            this.allboxes.forEach(box => {
                if(box.isVisible() && box.mode == "ontop") {
                    if(box.ontopLvl == 0 && !box.contains(enlargingbox.id || enlargingbox.tmpid))
                        box.hide();
                }
            });
        }
    }



}