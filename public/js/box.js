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
            editBtn: null,
            addPropBtn: null,
            fullscBtn: null,
            propContainer: null,
            collapsed: false,
        }

        this.propElements = {
            box: null,
            titleEl: null,
            editBtn: null,
            addPropBtn: null,
            propContainer: null,
            collapsed: false,
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
        if(this.elements.box)
            this.elements.box.dataset.id = id;
        if(this.propElements.box)
            this.propElements.box.dataset.id = id;
        if(this.pointElements.box)
            this.pointElements.box.dataset.id = id;
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
        if(mode == "default" || mode == "popup") {
            if(this.mode == "default" || this.mode == "popup")
                this.elements.box.classList.remove(this.mode+"-box");
            this.elements.box.classList.add(mode+"-box");
        }
        this._mode = mode;
    }

    get mode() {
        return this._mode;
    }

    get activeEls() {
        if(this.mode == "default" || this.mode == "popup")
            return this.elements;
        else if(this.mode == "prop")
            return this.propElements;
        else if(this.mode == "point")
            return this.pointElements;
        else return undefined;
    }


    get box () {
        return this.elements.box;
    }

    get titleEl() {
        return this.activeEls.titleEl;
    }

    get title() {            
        if(this.mode)
            return this.titleEl.textContent;
        else
            return this.tmpid || this.id;
    }

    set title(title) {
        this.titleEl.innerHTML = title
    }

    get editBtn() {
        return this.activeEls.editBtn;
    }

    get propEls() {
        let pCon = this.elements.propContainer;
        let pEls = [];
        for (let i = 0; i < pCon.childNodes.length; i++) {
            // if(pCon.childNodes[i].classList.contains("box"))
            pEls.push(pCon.childNodes[i])
        }
        return pEls;
    }
    
    changed() {
        if(this.elements.propContainer) {
            let propids = [];
            this.propEls.forEach((el)=>propids.push(el.dataset.id))
            this.data.props = propids;
        }
        this.checkForChildren();
        this.boxmgr.onBoxChange(this);
    }

    createBasicElements(container, elements=this.elements) {
        // box
        this.boxmgr.factory.createBoxEl(this, elements);
        // title
        this.boxmgr.factory.createTitle(this, elements);        
        // edit button
        this.boxmgr.factory.createEditBtn(this, elements);
    }

    createBoxAsDefault(container) {
        // box, titleEl, editBtn
        this.createBasicElements(container, this.elements);
        this.elements.box.classList.add("default-box");

        // prop container
        this.boxmgr.factory.createPropContainer(this, this.elements);

        // add-prop button
        this.boxmgr.factory.createAddPropBtn(this, this.elements);
        
        // quick infos
        // this.createQuickInfoContainers(this.elements);
        // this.quickInfoCons = this.elements.quickInfoCons;

        container.appendChild(this.elements.box);
    }

    createBoxAsPopup(container) {
        // box, titleEl, editBtn
        this.createBasicElements(container, this.elements);
        this.elements.box.classList.add("popup-box");

        // prop container
        this.boxmgr.factory.createPropContainer(this, this.elements);

        // add-prop button
        this.boxmgr.factory.createAddPropBtn(this, this.elements);

        // fullscreen button
        this.boxmgr.factory.createFullscreenBtn(this, this.elements);      

        // add in-between layer
        if(!this.layer) {
            this.layer = document.createElement("div");
            this.layer.classList.add("layer");
            this.layer.onclick = () => this.popUpVanish();
        } 
        document.body.appendChild(this.layer);
        document.body.appendChild(this.elements.box);
    }

    createBoxAsProp(container) {
        // box, titleEl, editBtn
        this.createBasicElements(container, this.propElements);
        this.propElements.box.classList.add("prop-box");

        container.appendChild(this.propElements.box);
    }

    createBoxAsPoint(container) {
        
    }

    createQuickInfoContainers() {
        this.boxmgr.factory.createQuickInfoContainers(elements);
        let clearEl1 = document.createElement("div");
        clearEl1.style.clear = "both";
        let clearEl2 = document.createElement("div");
        clearEl2.style.clear = "both";
        elements.box.insertBefore(elements.quickInfoCons[0], elements.titleEl);        
        elements.box.insertBefore(elements.quickInfoCons[1], elements.titleEl);
        elements.box.insertBefore(clearEl1, elements.titleEl);
        const nextSibling = elements.titleEl.nextSibling;
        elements.box.insertBefore(elements.quickInfoCons[2], nextSibling);        
        elements.box.insertBefore(elements.quickInfoCons[3], nextSibling);
        elements.box.insertBefore(clearEl2, nextSibling);
    }
    
    // creates blank prop - ready to be filled
    createNewProp() {
        if(this.mode == "point")
            return;

        let newbox = new Box({in: this.id || this.tmpid}, this.boxmgr);
        newbox.loadContent(this.elements.propContainer, "prop");
        return newbox;
    }

    addProp(box) {
        this.data.props.push(box.id);
        this.changed();
    }
        
    delete(boxEl) {
        const elements = this.elements.box == boxEl ? this.elements :
            this.propElements.box == boxEl ? this.propElements : this.pointElements;

        if(boxEl.classList.contains("deleted")) { // delete (final)
            let oldparent = this.boxmgr.getBox(this.data.in);
            oldparent.elements.propContainer.removeChild(this.propElements.box);
            boxEl.remove();
            oldparent.changed();
        } else { 
            boxEl.classList.add("deleted"); // delete (restorable)
            let tmptitle = this.title;
            this.title = "↺ wiederherstellen";
            elements.titleEl.contentEditable = false;
            this.boxmgr.closeMenu();
            let delbtn = document.createElement("button");
            delbtn.innerHTML = "&times;";
            delbtn.classList.add("delbtn");
            delbtn.onclick = () => this.delete(boxEl);
            boxEl.appendChild(delbtn);

            boxEl.onclick = (e) => { // restore
                e.stopPropagation();
                boxEl.classList.remove("deleted");
                this.title = tmptitle;
                this.boxmgr.factory.addEventsToBox(boxEl, this);
                delbtn.remove();
            };
        }
    }

    select() {
        this.propElements.box.classList.add("selected");
    }

    deselect() {
        this.propElements.box.classList.remove("selected");
    }

    swapEdit(elements) {
        if(elements.titleEl.contentEditable != "true") {
            this.startEdit(elements);
        } else {
            this.stopEdit(elements);
        }
    }
    
    startEdit(elements) {
        MathJax.startup.document.getMathItemsWithin([elements.titleEl]).forEach(math => {
            math.removeFromDocument(true);
        });
        elements.titleEl.contentEditable    = "true";
        elements.editBtn.style.transform    = "rotate(180deg) scale(1.6)";
        elements.editBtn.style.transition   = "0.5s"
        elements.titleEl.style.cursor       = "auto";
        elements.titleEl.style.userSelect   = "inherit";
        // set selection (cursor) to end   (includes focus)
        let range       = document.createRange(); // a range is a like the selection but invisible
        range.selectNodeContents(elements.titleEl); // select the entire contents with the range
        range.collapse(false); // collapse the range to the end point (false)
        let selection   = window.getSelection();
        selection.removeAllRanges(); 
        selection.addRange(range); // set previous range as new selection

        elements.box.onclick = (e) => e.stopPropagation();
        elements.box.oncontextmenu = (e) => e.stopPropagation();
    }

    stopEdit(elements) {
        elements.titleEl.style.cursor       = "pointer";
        elements.titleEl.style.userSelect   = "none";
        // messing up the focus of other editable element in firefox -> setTimeout needed
        setTimeout(()=>elements.titleEl.removeAttribute("contentEditable"),1);
        elements.editBtn.style.transform    = "";
        this.boxmgr.factory.addEventsToBox(elements.box, this);
        MathJax.typeset();
    }

    default() {
        if(this.mode == "popup") {
            this.elements.box.classList.remove("blurred");
            this.layer.remove();
            this.propElements.box.classList.add("selected");
            document.querySelector(".boxes").appendChild(this.box);
            this.elements.box.querySelector(".fullscbtn").remove();
            this.elements.box.style.top = "";
        } else if(this.elements.collapsed) {
            this.expandDefault();
        }
        this.mode = "default";
    }

    collapseDefault() {
        this.elements.propContainer.classList.add("hidden");
        this.elements.editBtn.classList.add("hidden"); 
        this.elements.addPropBtn.classList.add("hidden"); 
        this.elements.box.style.minHeight = "1rem";
        this.elements.collapsed = true;
    }

    expandDefault() {
        this.elements.propContainer.classList.remove("hidden");
        this.elements.editBtn.classList.remove("hidden"); 
        this.elements.addPropBtn.classList.remove("hidden"); 
        this.elements.box.style.minHeight = "";
        this.elements.collapsed = false;
    }

    fullscreen(nohistory = false) {
        // assume box is "popup" or "default" or "ontop"
        let boxes = document.querySelector(".boxes");

        if(this.mode == "default") {
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
            this.boxmgr.getBox(boxes.children[i]).collapseDefault();
        }

        this.elements.box.scrollIntoView();

        this.mode = "default"
        if(!nohistory)
            history.pushState({},"eab", "/"+this.boxmgr.getPath());
        this.boxmgr.fullscreen();
    }

    popUp(nohistory = false) {
        // add blur effect
        this.boxmgr.latestPopup.box.classList.add("blurred");
        
        // remove defaultbox fullscreenbutton
        this.boxmgr.fullscBtn.remove();

        // create second box
        this.loadContent(document.body, "popup");
        // move down a bit
        this.elements.box.style.top = 1+1.5*this.boxmgr.popups.length+"rem"
                
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
        
        // add defaultbox fullscreenbutton
        this.boxmgr.popups.length == 1 && this.boxmgr.addFullscreenButton();
    }
    
    prop() {
        this.elements.box.remove();
        if(!this.propElements.box) return; // deleted box //TODO handle correctly
        this.propElements.box.classList.remove("selected");
        this.mode = "prop";
    }


    // convert properties to JSON
    asJSON() {
        // note: new boxes are saved immediately to get an id -> no titleEl
        if(this.mode && !this.titleEl.querySelector(".MathJax"))
            this.data.title = this.title;
        
        return this.data;
    }

    // creates new elements, loads and sets title and loads props into propContainer
    loadContent(container, mode = this.mode || "default") { //TODO other name for function
        if(mode == "default")
            this.createBoxAsDefault(container);
        else if (mode == "popup")
            this.createBoxAsPopup(container);
        else if (mode == "prop")
            this.createBoxAsProp(container);
        else if (mode == "point")
            this.createBoxAsPoint(container);

        this.mode = mode;

        this.checkForChildren();
        if(this.mode == "default" || this.mode == "popup") {
            // load childrens content
            let filterprops = false;
            this.data.props.forEach(propid => {
                let propbox;
                if(propid[0] == "_") { // support for old versions ("props":["_tmpid123"])
                    propbox     = new Box({in: this.id, tmpid: propid}, this.boxmgr)
                    filterprops = true;
                } else
                    propbox = this.boxmgr.getBox(propid);
                propbox.loadContent(this.elements.propContainer, "prop");
            });
            if(filterprops) // remove for old propids ("props":["_tmpid123"])
                this.data.props = this.data.props.filter(propid => propid[0] != "_");
        }
        // load own content
        this.title = this.data.title;
        MathJax && MathJax.typeset && MathJax.typeset();
    }

    checkForChildren() {
        if(!this.propElements.box) return;
        if(this.data.props.length > 0) 
            this.propElements.box.classList.add("has-children");
        else    
            this.propElements.box.classList.remove("has-children");
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
        newbox.swapEdit(newbox.propElements);
    }

}

function randomId() {
    return '_' + Math.random().toString(36).substr(2);
}