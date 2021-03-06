const DURATION = 2000
const COLORS = ["primary", "success", "danger", "warning", "info", "secondary","light", "dark"]
const ANIMATION_PACE = 16

const getCharacters = data => {
    let res = {}
    let color = 0

    data.map(elt => elt.character)
        .forEach(character => {
            if (!res[character]) {
                res[character] = COLORS[color++]
            }
        })

    return res

}

class Sheet {

    constructor(idGoogleSheet) {

        this.speech = new p5.Speech()

        this.urlSheet = select("#urlSheet")
        this.select = select("#characterSelect")
        this.toggleRunButton = select("#toggleRunButton")
        this.nextButton = select("#nextButton")

        this.urlSheet.html(`URL Google sheet : <a target="_blank" href=${idGoogleSheet}>${idGoogleSheet}</a>`)

        this.pause = true

        this.speech.onStart = this.speechStarted.bind(this)
        this.speech.onEnd = this.speechEnded.bind(this)

        this.speech.setRate(1.2)

        this.toggleRunButton.html("Run")
        this.toggleRunButton.mousePressed((e) => {
            this.toggleRun()
        })

        this.nextButton.mousePressed(() => {
            this.next()
        })


    }

    speechStarted() {
        console.log("Démarré")
    }

    speechEnded() {
        console.log("Fin")

        if (this.id >= this.data.length) {
            console.log("Fin des répliques")
        } else if (this.pause) {
            console.log("En pause")
        } else {
            this.speakNext()
        }
    }

    init(data, tabletop) {
        this.data = data
        this.tabletop = tabletop
        // id of the next sentence to run
        this.id = 0
        this.characters = getCharacters(this.data)

        for (let character in this.characters) {
            this.select.option(character)
        }

        this.select.changed(this.characterChoice.bind(this))
    }

    characterChoice() {

        this.character = this.select.value()

        this.id = this.searchFirstSentence(this.character)
    }

    searchFirstSentence(character) {
        for (let i = 0; i < this.data.length; i++) {
            if (this.data[i].character === character) {
                return Math.max(i - 1, 0)
            }
        }
        // cas impossible
        return 0
    }

    toggleRun() {

        if (this.pause) {
            this.toggleRunButton.html("Pause")
            this.pause = false
            if (this.id < this.data.length) {
                this.speakNext()
                
            }
        } else {
            this.toggleRunButton.html("Re-run")
            this.pause = true

        }
    }

    skipToNext() {
        this.speech.cancel()
    }

    speakNext() {
        console.log("id", this.id, "(" + this.data.length + ")")
        const character = this.data[this.id].character
        
        let starter = `<span style="margin-right:10px" class="badge badge-${this.characters[character]}">${character}</span> `

        if (character === this.character) {
            let p = createP(starter + "  ")
            p.parent("myContainer")
            this.toggleRun()

            let progress = (percentage, nbSec) => `${starter} <div class="progress">
                <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100" style="width: ${percentage}%">${nbSec}</div>
                </div>`

            const duration = this.data[this.id].duration ? this.data[this.id].duration * 1000 : DURATION
            let percentage = 0
            let lap = 0
            const nbLaps = (duration / ANIMATION_PACE) * lap
            let html = `${starter} ${this.data[this.id].sentence}`

            const idInterval = setInterval(() => {
                lap++
                let timeLeft = Math.ceil((duration - (ANIMATION_PACE * lap)) / 1000)
                percentage = ANIMATION_PACE * lap / duration * 100
                console.log("lap/percentage", lap, percentage)
                p.html(progress(percentage, timeLeft))
                if (percentage >= 100) {
                    this.reveal.bind(this, p, html, idInterval)()
                }
            }, ANIMATION_PACE)

        } else {
            let p = createP(`${starter} ${this.data[this.id].sentence}`)
            p.parent("myContainer")
            this.speech.speak(this.data[this.id].sentence)
            this.id++

        }

        let myContainerHTML = document.querySelector("#myContainer")
        myContainerHTML.scrollTop = myContainerHTML.scrollHeight
    }

    /**
     * Révèle la phrase cachée
     * 
     * @param {*} paragraph 
     * @param {*} html 
     */
    reveal(paragraph, html, idInterval) {
        clearInterval(idInterval)
        this.id++
        paragraph.html(html)
        this.toggleRun()
    }

    keyPressed() {
        switch (keyCode) {
            case RIGHT_ARROW:
                this.skipToNext()
            case 32:
                this.toggleRun()
        }
    }

}