export default class Box {
    constructor(data, boxmgr) {
        this.data       = data || {};
        this.data.title = this.data.title || "";
        this.boxmgr     = boxmgr;
        if(!this.id) {
            this.data.tmpid = this.data.tmpid || randomId();
            this.data.props = [];
            this.boxmgr.saveNow(this);
        }
        this.boxmgr.addBox(this);
    }

    set id(id) {
        if(this.id && this.id == id) return;
        this.data._id = id;
        if(this.isVisible())
            this.box.dataset.id = id;
    }

    get id() {
        return this.data._id;
    }

    set tmpid(tmpid) {
        if(this.tmpid && this.tmpid == tmpid) return;
        this.data.tmpid = tmpid;
    }

    get tmpid() {
        return this.data.tmpid;
    }
    
    replacetmpid(newid) {
        // set id
        this.id = newid;
        this.boxmgr.addBox(this);
    }

    set mode(mode) {
        //* CSS
        if(this.mode) this.box.classList.remove(this.mode+"-box");
        this._mode = mode;
        this.box.classList.add(this.mode+"-box");
    }

    get mode() {
        return this._mode;
    }

    get titleEl() {
        return this.box.querySelector(".title");
    }

    get title() {
        if(this.box)
            return this.titleEl.textContent;
        else
            return this.tmpid || this.id;
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
        //return (this.box.offsetHeight != 0 && this.box.offsetWidth != 0)
        return !!(this.box)
    }

    contains(id) {
        // id == this.id    return true/false?
        return !!(this.box.querySelector("[data-id='"+id+"']") || this.box.querySelector("[data-tmpid='"+id+"']"))
    }
    
    changed() {
        if(this.isVisible()) {
            this.data.title = this.title;
            if(this.propContainer) {
                let propids = [];
                this.propEls.forEach((el)=>propids.push(el.dataset.id))
                this.data.props = propids;
            }
        }

        this.boxmgr.onBoxChange(this);
    }

    createBasicElements(container) {
        /*
        * containers
        */
        this.box     = document.createElement("div");
        this.box.classList.add("box");
        container.appendChild(this.box);
        if(this.id)
            this.box.dataset.id = this.id;
        this.addEventsToBox();
        
        let titleEl   = document.createElement("p");
        titleEl.spellcheck = false;
        titleEl.classList.add("title");
        this.box.appendChild(titleEl);        
        this.addEventsToTitle(titleEl)

        let btnContainer = document.createElement("div");
        this.btnContainer = btnContainer
        btnContainer.classList.add("btns");
        this.box.appendChild(btnContainer);

        let menuBtn   = document.createElement("button");
        menuBtn.innerHTML = "&#x22EE;";
        menuBtn.classList.add("menubtn");
        // btnContainer.appendChild(menuBtn);
        this.addEventToMenuButton(menuBtn);
     
        let editBtn   = document.createElement("button");
        this.editBtn  = editBtn;
        editBtn.innerHTML = "&#x270E;";
        editBtn.classList.add("editbtn");
        btnContainer.appendChild(editBtn);
        this.addEventToEditButton(editBtn);
    }

    createDetailElements() {
        /*
        * containers
        */
        let tagContainer = document.createElement("div");
        tagContainer.classList.add("tags");
        this.box.insertBefore(tagContainer, this.btnContainer);
        
        let propContainer  = document.createElement("div"); 
        this.propContainer = propContainer
        propContainer.classList.add("props");
        this.box.insertBefore(propContainer, this.btnContainer); // gets removed by "set mode" if mode=="point"

        let tag = document.createElement("span");
        tag.classList.add("tag");
        tag.innerText = "tag1";
        this.tagContainer.appendChild(tag);

        // add prop button
        let addPropBtn = document.createElement("button");
        this.addPropBtn = addPropBtn;
        addPropBtn.innerText = "+";
        addPropBtn.classList.add("btninsidebox");
        addPropBtn.classList.add("addprop");
        this.btnContainer.appendChild(addPropBtn);
        this.addEventToAddButton(addPropBtn);
        
        // fullscreen button
        let fullscBtn  = document.createElement("button");
        this.fullscBtn = fullscBtn
        fullscBtn.innerHTML = "&#x26F6;";
        fullscBtn.classList.add("btninsidebox");
        fullscBtn.classList.add("fullscbtn");
        this.btnContainer.appendChild(fullscBtn);
        fullscBtn.onclick = (e) => this.fullscreen()
        
        // child counter
        let childCounter  = document.createElement("button");
        this.childCounter = childCounter
        childCounter.innerText = "+0";
        childCounter.classList.add("childcounter");
        childCounter.classList.add("hidden");
        this.btnContainer.appendChild(childCounter);
        childCounter.onclick = (e) => this.fullscreen();

        this.activateDragAndDrop();
    }
    
    // creates blank prop - ready to be filled
    createNewProp() {
        if(this.mode == "point")
            return;

        let newbox = new Box({in: this.id || this.tmpid}, this.boxmgr);
        newbox.loadContent(this.propContainer, "prop");
        return newbox;
    }

    addProp(box) {
        this.data.props.push(box.id);
        this.changed();
    }
        
    delete() {
        if(this.box.classList.contains("deleted")) { // delete (final)
            let oldparent = this.boxmgr.getOwningBox(this.box.parentNode);
            this.box.parentNode.removeChild(this.box);
            oldparent.changed();
        } else { 
            this.box.classList.add("deleted"); // delete (restorable)
            let tmptitle = this.title;
            this.title = "↺ wiederherstellen";
            this.titleEl.contentEditable = false;
            this.boxmgr.closeMenu();
            let delbtn = document.createElement("button");
            delbtn.innerHTML = "&times;";
            delbtn.classList.add("delbtn");
            delbtn.onclick = () => this.delete();
            this.box.appendChild(delbtn);

            this.box.onclick = (e) => { // restore
                e.stopPropagation();
                this.box.classList.remove("deleted");
                this.title = tmptitle;
                this.addEventsToBox(this.titleEl); // resets this.titleEl.onclick
                delbtn.remove();
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

    swapEdit() {
        if(this.titleEl.contentEditable != "true") {
            this.titleEl.contentEditable = "true";
            this.editBtn.style.transform = "rotate(180deg) scale(1.6)";
            this.editBtn.style.transition = "0.5s"
            this.titleEl.style.cursor = "auto";
            this.titleEl.style.userSelect = "inherit";
            this.focusTitle();
            this.box.onclick = '';
            this.box.oncontextmenu = (e) => e.stopPropagation();
        } else {
            this.titleEl.style.cursor = "pointer";
            this.titleEl.contentEditable = "inherit";
            this.editBtn.style.transform = "";
            this.addEventsToBox();
        }
    }

    focusTitle() {
        this.titleEl.focus()
    }

    popUp() {
        // add blur effect
        this.boxmgr.popups[this.boxmgr.popups.length-1].box.classList.add("blurred");

        // add in-between layer
        this.layer = document.createElement("div");
        this.layer.classList.add("layer");
        document.body.appendChild(this.layer);
        this.layer.onclick = () => this.popUpVanish();
        
        // save box
        this.boxAsProp = this.box;
        // save editBtn
        this.editBtnAsProp = this.editBtn;
        
        // create second box
        this.loadContent(document.body, "popup");
        
        this.boxmgr.popups.push(this);
    }

    popUpVanish() {  
        // remove blur effect
        this.boxmgr.popups.pop();
        this.boxmgr.popups[this.boxmgr.popups.length-1].box.classList.remove("blurred");
        // remove in-between layer
        this.layer.remove();
        // restore box
        this.box.remove();
        this.box = this.boxAsProp;
        this.mode = "prop";
        // restore editBtn
        this.editBtn = this.editBtnAsProp;
    }

    fullscreen() {
        return;
        let boxes = document.querySelector(".boxes");

        // remove popup layer and blur effect
        this.box.classList.remove("blurred");
        boxes.classList.remove("blurred");
        if(this.layer)
            this.layer.remove();
        
        // remove other popups
        //TODO change other popups to ontop boxes
        for (let i = 1; i < this.boxmgr.popups.length-1; i++) {
            const popupbox = this.boxmgr.popups[i];
            popupbox.box.remove();
            if(popupbox.layer)
                popupbox.layer.remove();
        }

        boxes.removeChild(boxes.lastChild); //TODO change to ontop box
        boxes.appendChild(this.box);
        this.mode = "default"
    }

    activateDragAndDrop() {
        new Sortable(this.box.querySelector(".props"), {
            group: "box",
            delay: 400,
            animation: 400,
            delayOnTouchOnly: true,  //TODO no drag on buttons
            fallbackTolerance: 4,
            //touchStartThreshold: 5,
            dragClass: "sortable-drag",
            chosenClass: "sortable-chosen",
            ghostClass: "sortable-ghost",
            swapThreshold: 0.07,
            // direction: (this.mode == "prop") ? "vertical" : "horizontal",

            onChoose: (ev) => {
                if(ev.originalEvent.pointerType != "mouse") {
                    let box = this.boxmgr.getBox(ev.item.dataset.id);
                    this.boxmgr.openMenu(box);
                }
                console.log("onChoose");        
            },
            onStart: (ev) => {
                console.log("onStart");
                this.boxmgr.closeMenu();
                // this.boxmgr.prepareForDrop(ev);
                // let draggedBox  = this.boxmgr.getOwningBox(ev.item);
                // draggedBox.propContainer.classList.remove("display-block");
            },
            onEnd: (ev) => {
                this.changed();
                // this.boxmgr.onDropEnd();
                // if(ev.from != ev.to) {
                //     this.boxmgr.getOwningBox(ev.from).changed();
                //     this.boxmgr.getOwningBox(ev.to).changed();
                // } else if(ev.oldIndex != ev.newIndex) {
                //     this.boxmgr.getOwningBox(ev.from).changed();
                // }
            },
            onMove: (ev) => {
                console.log("onMove");
                // this.boxmgr.onDropEnd();          
                // this.boxmgr.prepareForDrop(ev);
                // let draggedBox  = this.boxmgr.getOwningBox(ev.dragged);
                // let toBox       = this.boxmgr.getOwningBox(ev.to);
                // this.boxmgr.changeMode(draggedBox, this.boxmgr.getSmallerModeName(toBox.mode));
            },
        });
    }

    // convert properties to JSON
    asJSON() {
        return this.data;
    }

    // creates new elements, loads and sets title and loads props into propContainer
    loadContent(container, mode = this.mode || "default") { //TODO other name for function
        this.createBasicElements(container);
        if(mode)
            this.mode = mode;
        if(this.mode == "default" || this.mode == "popup") {
            this.createDetailElements();
            // load childrens content
            let filterprops = false;
            this.data.props.forEach(propid => {
                let propbox;
                if(propid[0] == "_") { // support for old versions ("props":["_tmpid123"])
                    propbox     = new Box({in: this.id, tmpid: propid}, this.boxmgr)
                    filterprops = true;
                } else
                    propbox = this.boxmgr.getBox(propid);
                propbox.loadContent(this.propContainer, "prop");
            });
            if(filterprops) // remove for old propids ("props":["_tmpid123"])
                this.data.props = this.data.props.filter(propid => propid[0] != "_");
        }
        // load own content
        this.title = this.data.title;
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
        let newbox = this.createNewProp();
        newbox.focusTitle();
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

    addEventToEditButton(editBtn) {
        editBtn.onclick =
            (e) => {
                e.stopPropagation();
                this.swapEdit();
            }
    }

    addEventsToBox() {
        this.box.oncontextmenu =
            (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.boxmgr.openMenu(this);
            };
            
        this.box.onclick =
            (e) => {
                e.stopPropagation();
                if(this.boxmgr.menu.isVisible())
                    this.boxmgr.closeMenu();
                else if(this.mode == "prop")
                    this.popUp();
                else if(this.mode == "popup")
                    this.fullscreen();
            };
    }

    addEventsToTitle(titleEl) {
        // notify saver
        titleEl.oninput =
            (e) => {
                if(this.mode == "popup")
                    this.boxAsProp.querySelector(".title").innerHTML = e.target.innerHTML;
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