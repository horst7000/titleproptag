export default class {
    constructor() {
        
        /*
        *  creating
        */
        this.createElements();
        this.hide();

        /*
        * hide events
        */
        // this.boxEl.querySelector(".menubtn").onblur = (e) => {
        //     if(!e.relatedTarget || e.relatedTarget.parentNode != this.menuEl )
        //         this.hide();
        // }
    }

    get delbtn() {
        return this.menuEl.querySelector(".delbtn")
    }

    createElements() {
        this.menuEl = document.createElement("div");
        this.menuEl.classList.add("boxmenu");
        document.body.appendChild(this.menuEl);

        let testBtn  = document.createElement("button");
        this.testBtn = testBtn;
        testBtn.innerHTML = "T";
        testBtn.classList.add("bm-fullscbtn");
        testBtn.classList.add("bm-btn");
        // this.menuEl.appendChild(testBtn);
        
        // let fullBtn = document.createElement("button");
        // this.fullBtn = fullBtn;
        // fullBtn.innerHTML = "&#x26F6;";
        // fullBtn.classList.add("bm-fullscbtn");
        // fullBtn.classList.add("bm-btn");
        // this.menuEl.appendChild(fullBtn);

        let delBtn   = document.createElement("button");
        this.delBtn = delBtn;
        delBtn.innerHTML = "&times;";
        delBtn.classList.add("bm-delbtn");
        delBtn.classList.add("bm-btn");
        this.menuEl.appendChild(delBtn);
    }
    
    open(box, boxEl) {
        this.addEventToTestButton(this.testBtn, box)
        // this.addEventToFullButton(this.fullBtn, box)
        this.addEventToDelButton(this.delBtn, box, boxEl)
        this.show(boxEl);
    }

    addEventToTestButton(delBtn, box) {
        delBtn.onclick =
            (e) => {
                
                this.hide();
            };
    }

    addEventToDelButton(delBtn, box, boxEl) {
        delBtn.onclick =
            (e) => {
                e.stopPropagation();
                box.delete(boxEl);
                // boxmenu doesnt hide on first delete click.
                // It stays open and css class "deleted" hides all buttons
                // except delbtn.
            };
    }

    // addEventToFullButton(fullBtn, box) {
    //     fullBtn.onclick =
    //         (e) => {
    //             e.stopPropagation();
    //             box.popUp(true);
    //             box.fullscreen();
    //             this.hide();
    //         };
    // }


    show(boxEl) {
        boxEl.insertBefore(this.menuEl, boxEl.firstChild);
        let menuX = this.menuEl.getBoundingClientRect().x;
        if(menuX < 0)
            this.menuEl.style.right = menuX
    }

    hide() {
        if(this.isVisible()) {
            this.menuEl.parentNode.removeChild(this.menuEl);
        }
    }

    isVisible() {
        return !!(this.menuEl.parentNode)
    }

}