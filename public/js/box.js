import BoxMenu from "./boxmenu.js"

export default class Box {
    constructor(container, mode = "default", boxmgr) {
        /*
        *  creating
        */
        this.createElements(container);
        this.boxmgr     = boxmgr;
        this.boxmenu    = new BoxMenu(this);
        this.activateDragAndDrop();

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
    }

    set id(id) {
        if(this.id && this.id == id) return; // prevents unnecessary addition to boxmgr.allboxes
        if(this.id) this.boxmgr.removeBox(this.id);
        this.box.dataset.id = id;
        this.box.id = id;
        this.boxmgr.addBox(this);
    }

    get id() {
        return this.box.dataset.id;
    }

    set tmpid(tmpid) {
        if(this.tmpid && this.tmpid == tmpid) return; // prevents unnecessary addition to boxmgr.allboxes
        if(this.tmpid) this.boxmgr.removeBox(this.tmpid);
        this.box.dataset.tmpid = tmpid;
        this.box.id = tmpid;
        this.boxmgr.addBox(this);
    }

    get tmpid() {
        return this.box.dataset.tmpid;
    }
    
    replacetmpid(newid) {
        this.id = newid;
        // this.usedin.forEach(parentbox => {
        //     parentbox.changed();
        // });
        let parentBox = this.boxmgr.getOwningBox(this.box.parentNode) // parent of defaultbox is boxes container
        if(!parentBox.box.classList.contains("boxes"))
            parentBox.changed();
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
        this.updateElements()
    }

    get mode() {
        return this._mode;
    }

    set ontopLvl(lvl) {
        this._ontopLvl = lvl;
        this.updateElements()
    }

    get ontopLvl() {
        return this._ontopLvl;
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

        let tagContainer = document.createElement("div");
        tagContainer.classList.add("tags");
        this.box.appendChild(tagContainer);

        let tag = document.createElement("span");
        tag.classList.add("tag");
        tag.innerText = "tag1";
        tagContainer.appendChild(tag);
        
        let titleEl   = document.createElement("p");
        titleEl.contentEditable = true;
        titleEl.spellcheck = false;
        titleEl.classList.add("title");
        this.box.appendChild(titleEl);        
        this.addEventsToTitle(titleEl)

        let propContainer  = document.createElement("div"); 
        this.propContainer = propContainer
        propContainer.classList.add("props");
        this.box.appendChild(propContainer); // gets removed by "set mode" if mode=="point"

        let btnContainer = document.createElement("div");
        this.btnContainer = btnContainer
        btnContainer.classList.add("btns");
        this.box.appendChild(btnContainer);

        let menuBtn   = document.createElement("button");
        // menuBtn.innerHTML = "&#x2630;";
        menuBtn.innerHTML = "&#x22EE;";
        // menuBtn.innerHTML = ":";
        menuBtn.classList.add("menubtn");
        btnContainer.appendChild(menuBtn);
        this.addEventToMenuButton(menuBtn);

        // add prop button
        let addPropBtn = document.createElement("button");
        this.addPropBtn = addPropBtn;
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
        btnContainer.appendChild(childCounter);
        childCounter.onclick = (e) => this.fullscreen()
    }
    
    updateElements() {
        if(this.mode == "ontop")
            this.titleEl.contentEditable = false;
        else
            this.titleEl.contentEditable = true;

        // ADD PROP BUTTON
        if(this.mode == "ontop" || this.mode == "point")        
            this.addPropBtn.classList.add("hidden")
        else
            this.addPropBtn.classList.remove("hidden")
        
        // FULLSCREEN BUTTON
        if(this.mode == "prop" && this.propEls.length > 0) {
            this.fullscBtn.classList.remove("hidden")
        } else
            this.fullscBtn.classList.add("hidden");
        
        // OTHER BUTTONS
        if(this.mode == "point") {
            this.propContainer.classList.add("hidden")
            this.childCounter.classList.remove("hidden")
            this.updateChildCounter()
        } else {
            this.propContainer.classList.remove("hidden")
            this.childCounter.classList.add("hidden")
        }
        
        // remove hidden nodes to keep node depth low
        if(!this.isVisible() && this.box.contains(this.propContainer)) {
            this.box.removeChild(this.propContainer);
            console.log("removing props of "+this.title);
        } else if (this.isVisible() && !this.box.contains(this.propContainer))
            this.box.insertBefore(this.propContainer, this.btnContainer);
    }

    createProp() {
        if(this.mode == "point")
            return;

        let newbox;    
        newbox = new Box(this.propContainer, this.boxmgr.getSmallerModeName(this.mode), this.boxmgr);        
        this.updateElements();
        return newbox;
    }
    
    
    delete() {
        if(this.box.classList.contains("deleted")) { // delete (final)
            let oldparent = this.boxmgr.getOwningBox(this.box.parentNode);
            this.box.parentNode.removeChild(this.box);
            oldparent.changed();
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
                this.addEventsToTitle(this.titleEl); // resets this.titleEl.onclick
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

    highlight() {
        let hashid = "#"+(this.id || this.tmpid)
        // unset :target (css pseudoclass) so that
        // it can be set again to same value with effect
        if(window.location.hash == hashid)                    
            window.location.hash = '';
        setTimeout(() => {
            window.location.hash = hashid;            
        }, 1);
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
        while(this.mode != "default" && !this.box.parentNode.classList.contains("boxes"))
            this.boxmgr.zoomstepToBox(this);
        this.highlight()
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
            this.mode = this.boxmgr.getLargerModeName(this.mode);
        if(this.mode == "ontop")
            this.ontopLvl++;
    }

    shrink() {
        this.shrinkFlag = false;
        if(this.mode == "ontop")
            this.ontopLvl--;
        if(this.ontopLvl==-1)
            this.mode = this.boxmgr.getSmallerModeName(this.mode);
    }

    activateDragAndDrop() {
        new Sortable(this.box.querySelector(".props"), {
            group: "box",
            delay: 400,
            animation: 400,
            // delayOnTouchOnly: true,
            dragClass: "sortable-drag",
            chosenClass: "sortable-chosen",
            ghostClass: "sortable-ghost",
            swapThreshold: 0.1,
            // direction: (this.mode == "prop") ? "vertical" : "horizontal",

            onStart: (ev) => {
                this.boxmgr.prepareForDrop(ev);
                let draggedBox  = this.boxmgr.getOwningBox(ev.item);
                draggedBox.propContainer.classList.remove("display-block");
            },
            onEnd: (ev) => {
                this.boxmgr.onDropEnd();
                if(ev.from != ev.to) {
                    this.boxmgr.getOwningBox(ev.from).changed();
                    this.boxmgr.getOwningBox(ev.to).changed();
                } else if(ev.oldIndex != ev.newIndex) {
                    this.boxmgr.getOwningBox(ev.from).changed();
                }
            },
            onMove: (ev) => {
                // if(ev.to != ev.from) {
                    this.boxmgr.onDropEnd();          
                    this.boxmgr.prepareForDrop(ev);
                // }
                let draggedBox  = this.boxmgr.getOwningBox(ev.dragged);
                let toBox       = this.boxmgr.getOwningBox(ev.to);
                this.boxmgr.changeMode(draggedBox, this.boxmgr.getSmallerModeName(toBox.mode));
            },
        });
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
        //TODO count in loaded Data instead of propEls.length

        this.childCounter.innerText = "+"+count;
        if(this.mode == "point") {
            if(count == 0)
                this.childCounter.classList.add("hidden")
            else
                this.childCounter.classList.remove("hidden")
        }
    }

    /*
    * B U T T O N S
    */
    onAddButtonClick(e) {      
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
        // toggle button visibility
        menuBtn.onclick =
            (e) => {
                if(this.boxmenu.isVisible())
                    this.boxmenu.hide();
                else
                    this.boxmenu.show();
            };
    }

    addEventsToTitle(titleEl) {
        // navigate to ontop boxes
        titleEl.onclick =
            (e) => {
                if(this.mode == "ontop")
                    this.fullscreen();
            };
        
        // notify saver
        titleEl.oninput =
            (e) => {
                console.log(e);
                this.changed();
            };

        // prevent style from being inserted (paste) into title
        titleEl.addEventListener('paste', function(e) {
            e.preventDefault();
            var text = e.clipboardData.getData("text/plain");
            document.execCommand("insertHTML", false, text);
        });
    }

}

function randomId() {
    return '_' + Math.random().toString(36).substr(2);
}