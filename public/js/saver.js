export default class {
    constructor(collection) {
        // this.towatch   = [];
        this.toinsert  = new Set();
        this.toupdate  = new Set();
        this.collection = collection;
        this.startAutoSave();
    }

    get shareid() {
        return this.collection.shareid;
    }

    onBoxChange(box) {
        console.log(box.title + " changed");
        if(!box.id)
            this.insertSoon(box)
        else
            this.updateSoon(box)
    }

    insertSoonIfNew(box) {
        if(!box.id)
            this.insertSoon(box)
    }

    insertSoon(box) {
        this.toinsert.add(box);
        console.log("inserting "+box.title);
    }

    updateSoon(box) {
        this.toupdate.add(box);
        console.log("updating "+box.title);
    }

    // markBoxAsTop(id) {
    //     this.collection.boxids.push(id);
    // }


    initialSave() {
        this.save();
            
        history.pushState({}, this.shareid, this.shareid);
        this.startAutoSave();
    }

    prepareInsertData() {
        let insertdata = [];
        this.toinsert.forEach(box => {
            let jsonbox = box.asJSON();
            jsonbox.shareid = this.shareid;
            insertdata.push(jsonbox);
        });
        return insertdata;
    }

    save() {
        //! insert must be sent first to update ids for .asJSON in update
        let insertdata = this.prepareInsertData();
        if(insertdata.length > 0) {
            this.fetchPostBoxes(insertdata); //calls save() again
        } else {
            let updatedata = [];
            this.toupdate.forEach(box => {
                updatedata.push(box.asJSON());
            });
            if(updatedata.length > 0) {
                this.fetchPatchBoxes(updatedata);            
                //TODO detect collection change instead of updating with each boxchange
                this.fetchPutCollection();
            }
        }


    }

    startAutoSave() {
        setInterval(() => this.save(), 3000);
    }
    
    /**
     * 
     * 
     *           fetch
     * 
     */
    fetchPutCollection() {
        console.log("saving (upsert collection)...");
        const options = { //for fetch
            method: 'PUT',
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(this.collection)
        }
        fetch('/api/collection/'+this.shareid, options) // PUT
            .then((res) => console.log(res.status));
    }

    fetchPatchBoxes(data) {      // update existing boxes
        console.log("saving (patch boxes)...");
        const options = { //for fetch
            method: 'PATCH',
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(data)
        }
        fetch('/api/box/', options) // PATCH
            .then((res) => {
                console.log(res.status)
                if(res.status == 200)
                    this.toupdate.clear();
            });
    }

    fetchPostBoxes(data) {     // insert new boxes
        console.log("saving (insert boxes)...");
        const options = { //for fetch
            method: 'POST',
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(data)
        }
        fetch('/api/box/', options) // POST
            .then((res) => (res.json()))
            .then((json) => {
                // insert id, remove tmpid and move box from toinsert to toupdate
                json.forEach(resbox => {
                    this.toinsert.forEach(oldbox => {
                        if(oldbox.tmpid == resbox.tmpid) {
                            this.toinsert.delete(oldbox);
                            if(oldbox.tmpid == this.collection.defaultboxid)
                                this.collection.defaultboxid = resbox._id;
                            oldbox.replacetmpid(resbox._id);
                            this.updateSoon(oldbox);
                        }
                    });
                });
                this.save();
            });
    }
}

