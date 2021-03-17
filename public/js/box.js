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

        this.elements = {
            box: null,
            titleEl: null,
            propContainer: null,
            editBtn: null,
            fullscBtn: null,
        }

        this.propElements = {
            box: null,
            titleEl: null,
            propContainer: null,
            editBtn: null,
        }

        this.pointElements = {
            box: null,
            titleEl: null,
            editBtn: null,
        }

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
        if(this.propContainer) {
            let propids = [];
            this.propEls.forEach((el)=>propids.push(el.dataset.id))
            this.data.props = propids;
        }
        this.checkForChildren();
        this.boxmgr.onBoxChange(this);
    }

    createBasicElements(container) {
        // assume mode is unknown
        // (set later in load content -> changing classes -> elements need to be created first)

        // box
        this.box = this.boxmgr.factory.createBoxEl(this);

        // title
        this.box.appendChild(this.boxmgr.factory.createTitle(this));
        
        // button container
        this.btnContainer = this.boxmgr.factory.createBtnContainer(this);
        this.box.appendChild(this.btnContainer);

        // edit button
        this.editBtn = this.boxmgr.factory.createEditBtn(this);
        this.btnContainer.appendChild(this.editBtn);

        // quick infos
        // this.createQuickInfoContainers();

        container.appendChild(this.box);
    }

    createDetailElements() {
        // prop container
        this.propContainer = this.boxmgr.factory.createPropContainer(this);
        this.box.insertBefore(this.propContainer, this.btnContainer);

        // add-prop button
        this.addPropBtn = this.boxmgr.factory.createAddPropBtn(this);
        this.btnContainer.appendChild(this.addPropBtn);

        // fullscreen button
        if(this.mode == "popup") {
            this.fullscBtn = this.boxmgr.factory.createFullscreenBtn(this);
            this.btnContainer.appendChild(this.fullscBtn);
        }
    }

    createQuickInfoContainers() {
        this.quickInfoCons = this.boxmgr.factory.createQuickInfoContainers();
        let clearEl1 = document.createElement("div");
        clearEl1.style.clear = "both";
        let clearEl2 = document.createElement("div");
        clearEl2.style.clear = "both";
        this.box.insertBefore(this.quickInfoCons[0], this.titleEl);        
        this.box.insertBefore(this.quickInfoCons[1], this.titleEl);
        this.box.insertBefore(clearEl1, this.titleEl);
        this.box.insertBefore(this.quickInfoCons[2], this.btnContainer);        
        this.box.insertBefore(this.quickInfoCons[3], this.btnContainer);
        this.box.insertBefore(clearEl2, this.btnContainer);
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
            let oldparent = this.boxmgr.getBox(this.box.parentNode);
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

    show() {
        this.box.classList.remove("hidden")
    }

    hide() {
        this.box.classList.add("hidden")
    }

    swapEdit() {
        if(this.titleEl.contentEditable != "true") {
            this.startEdit();
        } else {
            this.stopEdit();
        }
    }
    
    startEdit() {
        MathJax.startup.document.getMathItemsWithin([this.titleEl]).forEach(math => {
            math.removeFromDocument(true);
        });
        this.titleEl.contentEditable    = "true";
        this.editBtn.style.transform    = "rotate(180deg) scale(1.6)";
        this.editBtn.style.transition   = "0.5s"
        this.titleEl.style.cursor       = "auto";
        this.titleEl.style.userSelect   = "inherit";
        this.titleEl.focus();
        this.box.onclick = (e) => e.stopPropagation();
        this.box.oncontextmenu = (e) => e.stopPropagation();
    }

    stopEdit() {
        this.titleEl.style.cursor       = "pointer";
        this.titleEl.style.userSelect   = "none";
        this.titleEl.contentEditable    = "inherit";
        this.editBtn.style.transform    = "";
        this.addEventsToBox();
        MathJax.typeset();
    }

    focusTitle() {
        this.swapEdit();
    }

    ontop() {
        // assume box was "default"
        this.propContainer.classList.add("hidden");
        this.btnContainer.classList.add("hidden"); 
        this.box.style.minHeight = "1rem";
        this.mode = "ontop";
    }

    default() {
        if(this.mode == "popup") {
            this.box.classList.remove("blurred");
            this.layer.remove();
            this.boxAsProp.classList.add("selected");
            document.querySelector(".boxes").appendChild(this.box);
            this.box.querySelector(".fullscbtn").remove();
            this.box.style.top = "";
        } else if(this.mode == "ontop") {
            this.propContainer.classList.remove("hidden");
            this.btnContainer.classList.remove("hidden"); 
            this.box.style.minHeight = "";
        }
        this.mode = "default";
    }

    fullscreen(nohistory = false) {
        // assume box is "popup" or "default" or "ontop"
        let boxes = document.querySelector(".boxes");

        if(this.mode == "default" || this.mode == "ontop") {
            let i = boxes.children.length-1;
            while(boxes.children[i] != this.box) {
                this.boxmgr.getBox(boxes.children[i]).prop();
                i--;
            }
        } else { // mode == "popup"
            // remove popup layer and blur effect
            boxes.classList.remove("blurred");

            // change other popups to ontop
            for (let i = 1; i < this.boxmgr.popups.length; i++) {
                this.boxmgr.popups[i].default();                
            }
            this.boxmgr.resetPopups();
        }

        // default to ontop
        for (let i = 0; i < boxes.children.length-2; i++) {
            this.boxmgr.getBox(boxes.children[i]).ontop();
        }

        this.box.scrollIntoView();

        this.mode = "default"
        if(!nohistory)
            history.pushState({},"eab", "/"+this.boxmgr.getPath());
        this.boxmgr.fullscreen();
    }

    popUp(nohistory = false) {
        // add blur effect
        this.boxmgr.latestPopup.box.classList.add("blurred");
        
        // add in-between layer
        if(!this.layer) {
            this.layer = document.createElement("div");
            this.layer.classList.add("layer");
            this.layer.onclick = () => this.popUpVanish();
        } 
        document.body.appendChild(this.layer);
        
        // save box
        this.boxAsProp = this.box;
        // save editBtn
        this.editBtnAsProp = this.editBtn;
        
        // remove defaultbox fullscreenbutton
        this.boxmgr.fullscBtn.remove();

        // create second box
        this.loadContent(document.body, "popup");
        // move down a bit
        this.box.style.top = 1+1.5*this.boxmgr.popups.length+"rem"
                
        // history
        this.boxmgr.popups.push(this);
        if(!nohistory)
            history.pushState({},"eab", "/"+this.boxmgr.getPath());
    }

    popUpVanish(nohistory = false) {
        // remove blur effect
        this.boxmgr.popups.pop();
        this.boxmgr.latestPopup.box.classList.remove("blurred");

        //history    
        if(!nohistory)
            history.pushState({},"eab", "/"+this.boxmgr.getPath());

        // remove in-between layer
        this.layer.remove();
        
        // clear unused MathItems from MathList in MathJax
        MathJax.startup.document.clearMathItemsWithin([this.box]);

        // restore box        
        this.prop();
        // restore editBtn
        this.editBtn = this.editBtnAsProp;
        
        // add defaultbox fullscreenbutton
        this.boxmgr.popups.length == 1 && this.boxmgr.addFullscreenButton();
    }
    
    prop() {
        this.box.remove();
        if(!this.boxAsProp) return; // deleted box //TODO handle correctly
        this.boxAsProp.classList.remove("selected");
        this.box = this.boxAsProp;
        this.mode = "prop";
    }


    // convert properties to JSON
    asJSON() {
        if(this.isVisible() && !this.titleEl.querySelector(".MathJax"))
            this.data.title = this.title;
        
        return this.data;
    }

    // creates new elements, loads and sets title and loads props into propContainer
    loadContent(container, mode = this.mode || "default") { //TODO other name for function
        this.createBasicElements(container);
        if(mode)
            this.mode = mode;
        this.checkForChildren();
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
        MathJax && MathJax.typeset && MathJax.typeset();
    }

    checkForChildren() {
        if(this.data.props.length > 0) {
            if(this.mode == "prop")
                this.box.classList.add("has-children");
            else if(this.boxAsProp)
                this.boxAsProp.classList.add("has-children");
        }
        else {
            if(this.mode == "prop")
                this.box.classList.remove("has-children");
            else if(this.boxAsProp)
                this.boxAsProp.classList.remove("has-children");
        }
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
                else if(this.mode == "prop") {
                    if(this.boxmgr.isFullscreen()) {
                        this.boxmgr.getBox(this.box.parentNode).fullscreen(true);
                        this.popUp(true);
                        this.fullscreen();
                    } else
                        this.popUp();
                }
                else if(this.mode == "popup" && e.target.classList.contains("title"))
                    {}//this.fullscreen();
                else if(this.boxAsProp && this.boxmgr.getOwningBox(e.target).classList.contains("prop-box")) {
                    this.boxmgr.getBox(this.boxAsProp.parentNode).fullscreen();
                }
                else if (this.mode == "default" && e.target.classList.contains("title"))
                      this.ontop();
                else if(this.mode == "ontop")
                    this.default();
            };
    }

}

function randomId() {
    return '_' + Math.random().toString(36).substr(2);
}