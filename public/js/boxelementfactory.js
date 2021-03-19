export default class BoxElementFactory {
    constructor(boxmgr) {
        this.boxmgr = boxmgr;
    }

    createBoxEl(box, elements) {
        let boxEl = document.createElement("div");
        boxEl.classList.add("box");
        if(box.id)
            boxEl.dataset.id = box.id;
        this.addEventsToBox(boxEl, box);
        elements.box = boxEl;
        return boxEl;
    }

    createTitle(box, elements) {
        let titleEl   = document.createElement("p");
        titleEl.spellcheck = false;
        titleEl.classList.add("title");
        this.addEventsToTitle(titleEl, box, elements);
        elements.titleEl = titleEl;
        elements.box.appendChild(titleEl);
        return titleEl;
    }

    createEditBtn(box, elements) {
        let editBtn   = document.createElement("button");
        editBtn.innerHTML = "&#x270E;";
        editBtn.classList.add("btninsidebox");
        editBtn.classList.add("editbtn");
        this.addEventToEditButton(editBtn, box, elements);
        elements.editBtn = editBtn;
        elements.box.appendChild(editBtn);
        return editBtn;
    }

    createQuickInfoContainers(elements) {
        let quickInfoCons = [];
        quickInfoCons.push(document.createElement("div"));
        quickInfoCons.push(document.createElement("div"));
        quickInfoCons.push(document.createElement("div"));
        quickInfoCons.push(document.createElement("div"));
        
        quickInfoCons[1].style.float = "right";
        quickInfoCons[3].style.float = "right";
                
        quickInfoCons[0].classList.add("quick-info");
        quickInfoCons[1].classList.add("quick-info");
        quickInfoCons[2].classList.add("quick-info");
        quickInfoCons[3].classList.add("quick-info");
        
        new Sortable(quickInfoCons[0], {
            group: {name: "box", pull: false},
            ghostClass: "sortable-quick",
        });
        new Sortable(quickInfoCons[1], {
            group: {name: "box", pull: false},
            ghostClass: "sortable-quick",
        });
        new Sortable(quickInfoCons[2], {
            group: {name: "box", pull: false},
            ghostClass: "sortable-quick",
        });
        new Sortable(quickInfoCons[3], {
            group: {name: "box", pull: false},
            ghostClass: "sortable-quick",
        });
        elements.quickInfoCons = quickInfoCons;
        return quickInfoCons;
    }

    createPropContainer(box, elements) {
        let propContainer  = document.createElement("div"); 
        propContainer.classList.add("props");
        this.activateDragAndDrop(propContainer, box);
        elements.propContainer = propContainer;
        elements.box.appendChild(propContainer);
        return propContainer;
    }

    createAddPropBtn(box, elements) {
        let addPropBtn = document.createElement("button");
        addPropBtn.innerText = "+";
        addPropBtn.classList.add("btninsidebox");
        addPropBtn.classList.add("addprop");
        this.addEventToAddButton(addPropBtn, box);
        elements.addPropBtn = addPropBtn;
        elements.box.appendChild(addPropBtn);
        return addPropBtn;
    }

    createFullscreenBtn(box, elements) {
        let fullscBtn  = document.createElement("button");
        fullscBtn.innerHTML = "&#x26F6;";
        fullscBtn.classList.add("btninsidebox");
        fullscBtn.classList.add("fullscbtn");
        this.addEventToFullscreenButton(fullscBtn, box);
        elements.fullscBtn = fullscBtn;
        elements.box.appendChild(fullscBtn);
        return fullscBtn;
    }








    /*
    *    E V E N T S
    */

    addEventsToBox(boxEl, box) {
        boxEl.oncontextmenu =
            (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.boxmgr.openMenu(box, boxEl);
            };
            
        boxEl.onclick =
            (e) => {
                e.stopPropagation();
                if(this.boxmgr.menu.isVisible())
                    this.boxmgr.closeMenu();
                else if(box.mode == "prop") {
                    if(this.boxmgr.isFullscreen()) {
                        this.boxmgr.getBox(boxEl.parentNode).fullscreen(true);
                        box.popUp(true);
                        box.fullscreen();
                    } else
                        box.popUp();
                }
                else if(box.mode == "popup" && e.target.classList.contains("title"))
                    {}
                else if(box.mode == "default" && boxEl.classList.contains("prop-box")) {
                    this.boxmgr.getBox(box.propElements.box.parentNode).fullscreen();
                }
                else if (box.mode == "default" && e.target.classList.contains("title") && !box.elements.collapsed)
                    box.collapseDefault();
                else if(box.elements.collapsed)
                    box.expandDefault();
            };
    }

    addEventsToTitle(titleEl, box, elements) {
        titleEl.onblur =
            (e) => {
                if(e.relatedTarget && e.relatedTarget == elements.editBtn) return;
                if(!(e.relatedTarget && e.relatedTarget.classList && e.relatedTarget.classList.contains("editbtn"))) {
                    // do nothing on related click //TODO not sure if click
                    const donothing = (ee) => {
                        ee.stopPropagation();
                        ee.stopImmediatePropagation();
                        document.removeEventListener("click", donothing, true);
                    }
                    document.addEventListener("click", donothing, true);
                    // only with capture=true (3rd argument) handler interacts at capturing phase and
                    // event can be stopped from propagate click events to children
                }
                box.stopEdit(elements);
                console.log("stopedit");
            };

        // notify saver
        titleEl.oninput =
            (e) => {
                if(box.mode == "default" || box.mode == "popup") {
                    if(titleEl == box.elements.titleEl && box.propElements.box) // default title changed -> update prop
                        box.propElements.titleEl.innerHTML = e.target.innerHTML;
                    else if(titleEl == box.propElements.titleEl) // prop title changed -> update default
                        box.elements.titleEl.innerHTML = e.target.innerHTML;
                }
                box.changed();
            };

        // prevent style from being inserted (paste) into title
        titleEl.addEventListener('paste', function(e) {
            e.preventDefault();
            var text = e.clipboardData.getData("text/plain");
            document.execCommand("insertHTML", false, text);
        });
    }

    addEventToEditButton(editBtn, box, elements) {
        editBtn.onclick =
            (e) => {
                e.stopPropagation();
                box.swapEdit(elements);
            }
    }

    activateDragAndDrop(propContainer, box) {
        new Sortable(propContainer, {
            group: { name: "box", pull: "clone", revertClone: true },
            delay: 400,
            animation: 400,
            delayOnTouchOnly: true,
            fallbackTolerance: 4,
            //touchStartThreshold: 5,
            dragClass: "hidden",
            // chosenClass: "sortable-chosen",
            // ghostClass: "sortable-ghost",
            swapThreshold: 0.07,
            // direction: (box.mode == "prop") ? "vertical" : "horizontal",

            onChoose: (ev) => { // as soon as delay ends
                // if(ev.originalEvent.pointerType != "mouse") {
                //     const box = this.boxmgr.getBox(ev.item.dataset.id);
                //     this.boxmgr.openMenu(box, ev.item);
                // }                
            },
            onStart: (ev) => {
                this.boxmgr.closeMenu();
                // box.quickInfoCons[0].classList.add("quick-info-border");
                // box.quickInfoCons[1].classList.add("quick-info-border");
                // box.quickInfoCons[2].classList.add("quick-info-border");
                // box.quickInfoCons[3].classList.add("quick-info-border");
            },
            onEnd: (ev) => {
                if(ev.to.classList.contains("quick-info")) {
                    const quickinfo = document.createElement("span");
                    quickinfo.innerText = ev.item.querySelector(".title").innerText;
                    ev.to.appendChild(quickinfo);

                    ev.from.insertBefore(ev.item, ev.clone);
                    ev.clone.remove();
                }

                if(ev.oldIndex != ev.newIndex)
                    box.changed();
                
                // box.quickInfoCons[0].classList.remove("quick-info-border");
                // box.quickInfoCons[1].classList.remove("quick-info-border");
                // box.quickInfoCons[2].classList.remove("quick-info-border");
                // box.quickInfoCons[3].classList.remove("quick-info-border");
            },
        });
    }

    addEventToAddButton(addPropBtn, box) {
        addPropBtn.onclick =
            (e) => {
                box.onAddButtonClick(e);
            };
    }
    
    addEventToFullscreenButton(fullscBtn, box) {
        fullscBtn.onclick =
            (e) => {
                e.stopPropagation();
                box.fullscreen();
            }
    }
}