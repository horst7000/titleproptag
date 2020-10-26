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
        this.ontopLvl   = this.mode == "ontop" ? 0 : -1;

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

        if(this.mode == "prop" && !this.btnContainer.contains(this.fullscBtn)) {
            this.btnContainer.appendChild(this.fullscBtn);
        } else if(this.mode != "prop" && this.btnContainer.contains(this.fullscBtn))
            this.btnContainer.removeChild(this.fullscBtn);

        if(this.mode == "point" && this.isVisible() && this.box.contains(this.propsAndButtons)) {
            this.box.removeChild(this.propsAndButtons);
        } else if(this.mode != "point" && !this.box.contains(this.propsAndButtons))
            this.box.appendChild(this.propsAndButtons);
            
        if(this.mode == "point" && !this.box.contains(this.childCounter)) {
            this.box.appendChild(this.childCounter);
            this.updateChildCounter()
        } else if(this.mode != "point" && this.box.contains(this.childCounter))
            this.box.removeChild(this.childCounter);
    }

    get mode() {
        return this._mode;
    }

    get titleEl() {
        return this.box.querySelector(".title");
    }

    get title() {
        return this.titleEl.textContent;
    }

    set title(title) {
        this.titleEl.innerHTML = title
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
        let pCon = this.propContainer;
        let pEls = [];
        for (let i = 0; i < pCon.childNodes.length; i++) {
            // if(pCon.childNodes[i].classList.contains("box"))
            pEls.push(pCon.childNodes[i])
        }
        return pEls;
    }

    isVisible() {
        return (this.box.offsetHeight != 0 && this.box.offsetWidth != 0)
    }

    contains(id) {
        // id == this.id    return true/false?
        return !!(this.box.querySelector("[data-id='"+id+"']") || this.box.querySelector("[data-tmpid='"+id+"']"))
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
        container.appendChild(this.box);

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
        this.addEventToTitle(titleEl)

        let propsAndButtons  = document.createElement("div");
        this.propsAndButtons = propsAndButtons
        propsAndButtons.classList.add("props-and-buttons");
        this.box.appendChild(propsAndButtons); // is removed by "set mode" if mode=="point

        let propContainer  = document.createElement("div"); 
        this.propContainer = propContainer
        propContainer.classList.add("props");
        propsAndButtons.appendChild(propContainer);

        let btnContainer = document.createElement("div");
        this.btnContainer = btnContainer
        btnContainer.classList.add("btns");
        propsAndButtons.appendChild(btnContainer);

        // add prop button
        let addPropBtn = document.createElement("button");
        addPropBtn.innerText = "+";
        addPropBtn.classList.add("btninsidebox");
        addPropBtn.classList.add("addprop");
        btnContainer.appendChild(addPropBtn);
        this.addEventToAddButton(addPropBtn);
        
        // fullscreen button
        let fullscBtn  = document.createElement("button");
        this.fullscBtn = fullscBtn
        fullscBtn.innerHTML = "&#x26F6;";
        fullscBtn.classList.add("btninsidebox");
        fullscBtn.classList.add("fullscbtn");
        btnContainer.appendChild(fullscBtn);
        fullscBtn.onclick = (e) => this.fullscreen()
        
        // child counter
        let childCounter  = document.createElement("button");
        this.childCounter = childCounter
        childCounter.innerText = "+0";
        childCounter.classList.add("childcounter");
        childCounter.classList.add("hidden");
        this.box.appendChild(childCounter);
        childCounter.onclick = (e) => this.fullscreen()
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
                this.addEventToTitle(this.titleEl); // resets this.titleEl.onclick
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

    show() {
        this.box.classList.remove("hidden")
    }

    hide() {
        this.box.classList.add("hidden")
    }

    focusTitle() {
        this.titleEl.focus()
    }

    fullscreen() {
        while(this.mode != "default")
            this.boxmgr.enlargeBox(this);
        this.box.scrollIntoView()
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
        if(this.ontopLvl == -1)
            this.mode = this.getLargerModeName();
        if(this.mode == "ontop")
            this.ontopLvl++;
    }

    shrink() {
        this.shrinkFlag = false;
        if(this.mode == "ontop")
            this.ontopLvl--;
        if(this.ontopLvl==-1)
            this.mode = this.getSmallerModeName();
    }

    asJSON() {
        // convert properties to JSON
        let propids = [];
        let props = this.propEls;
        for (let i = 0; i < props.length; i++) {
            propids.push(props[i].dataset.id || props[i].dataset.tmpid);
        }

        return {
            id: this.id,
            tmpid: this.tmpid,
            title: this.title,
            props: propids
        };
    }

    loadContent(newid = (this.id || this.tmpid)) {
        if(newid[0] == "_") {
            // if box has a tmpid it has no props to load
            this.tmpid = newid;
            return;
        }
        if(this.propContainer.querySelector(".box")) {
            // if propContainer has elements apart from add button
            // then content has already been loaded
            this.propEls.forEach(propEl => {
                if(propEl.classList.contains("box")) {
                    propEl.classList.remove("hidden")
                }
            })
            return;
        }
        
        this.id    = newid;
        this.removetmpid();
        
        let json = this.boxmgr.requestBoxData(newid);
        if(json) {
            // load title
            this.title = json.title;

            
            this.updateChildCounter(json.props.length)

            // load props i.e. add containers for constructors of new boxes
            json.props.forEach(propid => {            
                if(this.mode != "point") {
                    let newbox = this.createProp();
                    newbox.loadContent(propid);
                }
            });
        }

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

    updateChildCounter(count = this.propEls.length) {
        this.childCounter.innerText = "+"+count;
        if(count == 0)
            this.childCounter.classList.add("hidden")
        else
            this.childCounter.classList.remove("hidden")

    }

    /*
    * B U T T O N S
    */
    onAddButtonClick(e) {
        // if(this.mode == "point") { // if point no prop can be added
        //     this.boxmgr.enlargeBox(this);
        // }
        
        let newbox = this.createProp();
        newbox.focusTitle();
        this.changed();
    }

    addEventToAddButton(addProp) {
        addProp.onclick =
            (e) => {
                this.onAddButtonClick(e);
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

    addEventToTitle(titleEl) {
        titleEl.onclick =
            (e) => {
                if(this.mode == "ontop" && !this.box.parentNode.classList.contains("boxes"))
                    this.fullscreen();
            };
    }

}

function randomId() {
    return '_' + Math.random().toString(36).substr(2);
}