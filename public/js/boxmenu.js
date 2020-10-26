export default class {
    constructor(box) {
        this.box     = box;
        this.boxEl   = box.box;
        /*
        *  creating
        */
        this.createElements();

        /*
        * hide events
        */
        this.boxEl.querySelector(".menubtn").onblur = (e) => {
            if(!e.relatedTarget || e.relatedTarget.parentNode != this.menuEl )
                this.hide();
        }
    }

    get delbtn() {
        return this.menuEl.querySelector(".delbtn")
    }

    createElements() {
        this.menuEl = document.createElement("div");
        this.menuEl.classList.add("boxmenu");

        let testBtn = document.createElement("button");
        testBtn.innerHTML = "T";
        testBtn.classList.add("fullbtn");
        // this.menuEl.appendChild(testBtn);
        this.addEventToTestButton(testBtn)
        
        let fullBtn = document.createElement("button");
        fullBtn.innerHTML = "&#x26F6;";
        fullBtn.classList.add("fullbtn");
        this.menuEl.appendChild(fullBtn);
        this.addEventToFullButton(fullBtn)

        let delBtn = document.createElement("button");
        delBtn.innerHTML = "&times;";
        delBtn.classList.add("delbtn");
        this.menuEl.appendChild(delBtn);
        this.addEventToDelButton(delBtn)
    }
    
    addEventToTestButton(delBtn) {
        delBtn.onclick =
            (e) => {
                console.log(this.box.propContainer.querySelector("[data-id='"+this.box.id+"'] > .box"));

                this.hide();
            };
    }

    addEventToDelButton(delBtn) {
        delBtn.onclick =
            (e) => {
                this.box.delete();
                // boxmenu doesnt hide on first delete click.
                // It stays open and css class "deleted" hides all buttons
                // except delbtn.
            };
    }

    addEventToFullButton(fullBtn) {
        fullBtn.onclick =
            (e) => {
                this.box.fullscreen();
                this.hide();
            };
    }


    show() {
        this.boxEl.insertBefore(this.menuEl, this.boxEl.firstChild);
        this.box.select();
    }

    hide() {
        if(this.isVisible()) {
            this.boxEl.removeChild(this.menuEl);
            this.box.deselect();
        }
    }

    isVisible() {
        return !!(this.menuEl.parentNode)
    }

}