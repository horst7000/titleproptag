import BoxMenu from "./boxmenu.js"

export default class Box {
    constructor(container, mode = "default", boxmgr) {
        /*
        *  creating
        */
        this.createElements(container);
        this.boxmgr     = boxmgr;
        this.boxmenu    = new BoxMenu(this);

        /*
        * initialising
        */
        this.tmpid      = randomId(); // tmpid change adds box to boxmgr.allboxes
        this.mode       = mode; //"ontop" "default" "prop" "point"
        // additional css modes:    "deleted" "selected"
        this.enlargeFlag= false;
        this.shrinkFlag = false;

        /*
        * collecting
        */
        this.usedin = new Set();

        /*
        * saving
        */
        this.titleEl.oninput = (() => this.changed());
    }

    set id(id) {
        if(this.id && this.id == id) return; // prevents unnecessary addition to boxmgr.allboxes
        if(this.id) this.boxmgr.removeBox(this.id);
        this.box.dataset.id = id;
        this.boxmgr.addBox(this);
    }

    get id() {
        return this.box.dataset.id;
    }

    set tmpid(tmpid) {
        if(this.tmpid && this.tmpid == tmpid) return; // prevents unnecessary addition to boxmgr.allboxes
        if(this.tmpid) this.boxmgr.removeBox(this.tmpid);
        this.box.dataset.tmpid = tmpid;
        this.boxmgr.addBox(this);
    }

    get tmpid() {
        return this.box.dataset.tmpid;
    }
    
    replacetmpid(newid) {
        this.id = newid;
        this.usedin.forEach(parentbox => {
            parentbox.changed();
        });
        this.removetmpid();
    }

    removetmpid() {
        this.boxmgr.removeBox(this.tmpid);
        delete this.box.dataset.tmpid;
    }

    set mode(mode) {
        //* CSS
        if(this.mode) this.box.classList.remove(this.mode+"-box");
        this._mode = mode;
        this.box.classList.add(this.mode+"-box");

        //* ELEMENT SETTINGS
        if(mode == "ontop")
            this.titleEl.contentEditable = false;
        else
            this.titleEl.contentEditable = true;

        if(this.mode == "point" && this.isVisible()) {
            this.box.removeChild(this.propContainer);
        } else if(this.mode != "point" && !this.box.contains(this.propContainer))
            this.box.appendChild(this.propContainer);
    }

    get mode() {
        return this._mode;
    }

    get titleEl() {
        return this.box.querySelector(".title");
    }

    get title() {
        return this.titleEl.innerText;
    }

    set title(title) {
        this.titleEl.innerText = title
    }

    get tagContainer() {
        return this.box.querySelector(".tags")
    }

    get tagElements() {
        let tags = this.propContainer;
        if(tags)
            return tags.childNodes;
        else
            return [];
    }

    // get propContainer() {
    //     return this.box.querySelector(".props")
    // }

    get propEls() {
        let props = this.propContainer;
        if(props)
            return props.childNodes;
        else
            return [];
    }

    isVisible() {
        return (this.box.offsetHeight != 0 && this.box.offsetWidth != 0)
    }

    changed() {
        this.boxmgr.onBoxChange(this);
    }

    createElements(container) {
        /*
        * containers
        */
        this.box     = document.createElement("div");
        this.box.classList.add("box");
        container.insertBefore(this.box, container.lastChild);

        let menuBtn   = document.createElement("button");
        menuBtn.innerHTML = ":";
        menuBtn.classList.add("menubtn");
        this.box.appendChild(menuBtn);
        this.addEventToMenuButton(menuBtn);

        let tagContainer = document.createElement("div");
        tagContainer.classList.add("tags");
        this.box.appendChild(tagContainer);

        let tag = document.createElement("span");
        tag.classList.add("tag");
        tag.innerText = "tag1";
        tagContainer.appendChild(tag);
        
        let titleEl   = document.createElement("p");
        titleEl.contentEditable = true;
        titleEl.classList.add("title");
        this.box.appendChild(titleEl);

        let propContainer = document.createElement("div"); 
        this.propContainer = propContainer
        propContainer.classList.add("props");
        this.box.appendChild(propContainer); // is removed by "set mode" if mode=="point

        // add prop button
        let addProp = document.createElement("p");
        addProp.innerText = "+";
        addProp.classList.add("addprop");
        propContainer.appendChild(addProp);

        this.addEventToAddButton(addProp);
    }
    
    createProp() {
        if(this.mode == "point")
            return;

        let newbox;    
        newbox = new Box(this.propContainer, this.getSmallerModeName(), this.boxmgr);        
        newbox.usedin.add(this);
        return newbox;
    }
    
    
    delete() {
        if(this.box.classList.contains("deleted")) { // delete (final)
            this.box.parentNode.removeChild(this.box);
            this.usedin.forEach((box) => box.changed()); //TODO only .changed() for concerned container
        } else { 
            this.box.classList.add("deleted"); // delete (restorable)
            this.tmptitle = this.title;
            this.title = "↺ wiederherstellen";
            this.titleEl.contentEditable = false;
            // boxmenu doesnt hide on delete click. It stays open and css class "deleted" hides all buttons
            // except delbtn.

            this.titleEl.onclick = (e) => { // restore
                this.box.classList.remove("deleted");
                this.title = this.tmptitle;
                this.titleEl.contentEditable = true;
                this.titleEl.onclick = null;
                this.boxmenu.hide();
            };
        }
    }

    select() {
        this.box.classList.add("selected");
    }

    deselect() {
        this.box.classList.remove("selected");
    }

    fullscreen() {
        this.boxmgr.fullscreen(this);
    }
    
    getLargerModeName() {
        if(this.mode == "ontop")
            return "ontop"
        
        if(this.mode == "default")
            return "ontop"
        
        if(this.mode == "prop")
            return "default"

        if(this.mode == "point")
            return "prop"
    }

    getSmallerModeName() {
        if(this.mode == "ontop")
            return "default"
        
        if(this.mode == "default")
            return "prop"
        
        if(this.mode == "prop")
            return "point"

        if(this.mode == "point")
            return "point"
    }

    setEnlargeFlag() {
        this.enlargeFlag = true;
    }

    setShrinkFlag() {
        this.shrinkFlag = true;
    }

    enlarge() {
        this.enlargeFlag = false;
        this.mode        = this.getLargerModeName();
    }

    shrink() {
        this.shrinkFlag = false;
        this.mode       = this.getSmallerModeName();
    }

    asJSON() {
        // convert properties to JSON
        let propids = [];
        let props = this.propEls;
        for (let i = 0; i < props.length; i++) {
            if(props[i].classList.contains("addprop"))
                continue;
            propids.push(props[i].dataset.id || props[i].dataset.tmpid);
        }

        return {
            id: this.id,
            tmpid: this.tmpid,
            title: this.titleEl.innerText,
            props: propids
        };
    }

    loadContent(newid) {
        if(newid[0] == "_") {
            // if box has a tmpid it has no props to load
            this.tmpid = newid;
            return;
        }
        if(this.propEls.length > 1) {
            // if propContainer has elements apart from add button
            // then content has already been loaded
            return;
        }
            
        let json = this.boxmgr.requestBoxData(newid);
        // if(!json)
        //     return
        this.id    = newid;
        this.removetmpid();

        // load title
        this.title = json.title;
        // load props i.e. add containers for constructors of new boxes
        json.props.forEach(propid => {            
            if(this.mode != "point") {
                let newbox = this.createProp();
                newbox.loadContent(propid);
            }
        });

        // const options = { //for fetch
        //     method: 'GET',
        //     headers: {"Content-Type": "application/json"}
        // }
        // fetch('/api/box/'+id, options) // GET
        //     .then((res) => res.json())
        //     .then(json => {
        //         this.id    = id;
        //         this.removetmpid();

        //         // load title
        //         this.title = json.title;
        //         // load props i.e. add containers for constructors of new boxes
        //         json.props.forEach(propid => {
        //             let newbox = this.createProp();
        //             newbox.loadContent(propid);
        //         });
        //     });
    }


    /*
    * B U T T O N S
    */
    addEventToAddButton(addProp) {
        addProp.onclick =
            (e) => {
                this.createProp();
                this.changed();
            };
    }

    addEventToMenuButton(menuBtn) {
        menuBtn.onclick =
            (e) => {
                if(this.boxmenu.isVisible())
                    this.boxmenu.hide();
                else
                    this.boxmenu.show();
            };
    }

}

function randomId() {
    return '_' + Math.random().toString(36).substr(2);
}