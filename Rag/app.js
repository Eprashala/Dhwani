import * as pdfjsLib
    from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs";


/* -------------------------------------------------------
   GLOBAL VARIABLES
------------------------------------------------------- */

let selectedFile = null;

let processedPages = [];

let finalJSON = null;


/* -------------------------------------------------------
   DOM ELEMENTS
------------------------------------------------------- */

const fileInput =
    document.getElementById("fileInput");

const chooseFile =
    document.getElementById("chooseFile");

const dropZone =
    document.getElementById("dropZone");

const fileName =
    document.getElementById("fileName");

const startButton =
    document.getElementById("startButton");

const progressBar =
    document.getElementById("progressBar");

const progressPercent =
    document.getElementById("progressPercent");

const statusText =
    document.getElementById("statusText");

const currentPage =
    document.getElementById("currentPage");

const totalPages =
    document.getElementById("totalPages");

const processingMode =
    document.getElementById("processingMode");

const textPreview =
    document.getElementById("textPreview");

const characterCount =
    document.getElementById("characterCount");

const downloadButton =
    document.getElementById("downloadButton");

const jsonStatus =
    document.getElementById("jsonStatus");

const languageSelect =
    document.getElementById("language");

const ocrScaleSelect =
    document.getElementById("ocrScale");

const ocrModeSelect =
    document.getElementById("ocrMode");


/* -------------------------------------------------------
   PDF WORKER
------------------------------------------------------- */

pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs";


/* -------------------------------------------------------
   FILE SELECTION
------------------------------------------------------- */

chooseFile.addEventListener(
    "click",
    () => fileInput.click()
);


fileInput.addEventListener(
    "change",
    event => {

        const file =
            event.target.files[0];

        if (file) {

            selectFile(file);

        }

    }
);


/* -------------------------------------------------------
   DRAG AND DROP
------------------------------------------------------- */

dropZone.addEventListener(
    "dragover",
    event => {

        event.preventDefault();

        dropZone.classList.add("dragover");

    }
);


dropZone.addEventListener(
    "dragleave",
    () => {

        dropZone.classList.remove("dragover");

    }
);


dropZone.addEventListener(
    "drop",
    event => {

        event.preventDefault();

        dropZone.classList.remove("dragover");

        const file =
            event.dataTransfer.files[0];

        if (file) {

            selectFile(file);

        }

    }
);


/* -------------------------------------------------------
   SELECT FILE
------------------------------------------------------- */

function selectFile(file) {

    selectedFile = file;

    fileName.textContent =
        `${file.name} (${formatFileSize(file.size)})`;

    startButton.disabled = false;

}


/* -------------------------------------------------------
   FILE SIZE
------------------------------------------------------- */

function formatFileSize(bytes) {

    if (bytes < 1024)
        return bytes + " B";

    if (bytes < 1024 * 1024)
        return (bytes / 1024).toFixed(1) + " KB";

    return (
        bytes /
        (1024 * 1024)
    ).toFixed(1) + " MB";

}


/* -------------------------------------------------------
   START
------------------------------------------------------- */

startButton.addEventListener(
    "click",
    async () => {

        if (!selectedFile) {

            alert("Please select a book first.");

            return;

        }

        startButton.disabled = true;

        processedPages = [];

        finalJSON = null;

        textPreview.value = "";

        downloadButton.disabled = true;

        jsonStatus.textContent =
            "Processing book...";

        try {

            if (
                selectedFile.type ===
                "application/pdf"
            ) {

                await processPDF(
                    selectedFile
                );

            }

            else if (
                selectedFile.type.startsWith(
                    "image/"
                )
            ) {

                await processImage(
                    selectedFile
                );

            }

            else {

                throw new Error(
                    "Unsupported file format."
                );

            }

            createJSON();

        }

        catch (error) {

            console.error(error);

            statusText.textContent =
                "Error: " + error.message;

            alert(
                "Processing failed.\n\n" +
                error.message
            );

        }

        finally {

            startButton.disabled = false;

        }

    }
);


/* -------------------------------------------------------
   PROCESS PDF
------------------------------------------------------- */

async function processPDF(file) {

    statusText.textContent =
        "Loading PDF...";

    const arrayBuffer =
        await file.arrayBuffer();

    const pdf =
        await pdfjsLib.getDocument({
            data: arrayBuffer
        }).promise;

    const pageCount =
        pdf.numPages;

    totalPages.textContent =
        pageCount;

    processingMode.textContent =
        "PDF";

    let allText = "";

    for (
        let pageNumber = 1;
        pageNumber <= pageCount;
        pageNumber++
    ) {

        currentPage.textContent =
            pageNumber;

        const percent =
            Math.round(
                (pageNumber / pageCount) * 100
            );

        updateProgress(
            percent,
            `Processing page ${pageNumber}`
        );


        const page =
            await pdf.getPage(
                pageNumber
            );


        /*
           First attempt:
           extract normal PDF text
        */

        const textContent =
            await page.getTextContent();

        let text =
            textContent.items
                .map(item => item.str)
                .join(" ");


        text =
            cleanText(text);


        /*
           Determine whether OCR
           is required
        */

        const forceOCR =
            ocrModeSelect.value === "always";


        const needsOCR =
            text.length < 40;


        if (
            forceOCR ||
            needsOCR
        ) {

            statusText.textContent =
                `OCR page ${pageNumber}...`;

            processingMode.textContent =
                "OCR";


            text =
                await OCRPage(
                    page
                );

        }

        else {

            processingMode.textContent =
                "Text Extraction";

        }


        text =
            cleanText(text);


        const pageData = {

            page: pageNumber,

            text: text,

            method:
                forceOCR || needsOCR
                    ? "ocr"
                    : "text"

        };


        processedPages.push(
            pageData
        );


        /*
           Update preview
        */

        allText +=
            `\n\n--- PAGE ${pageNumber} ---\n\n`;

        allText += text;

        updatePreview(
            allText
        );

    }


    updateProgress(
        100,
        "PDF processing complete"
    );

}


/* -------------------------------------------------------
   OCR PAGE
------------------------------------------------------- */

async function OCRPage(page) {

    const scale =
        parseFloat(
            ocrScaleSelect.value
        );


    const viewport =
        page.getViewport({
            scale: scale
        });


    const canvas =
        document.createElement(
            "canvas"
        );


    const context =
        canvas.getContext(
            "2d"
        );


    canvas.width =
        viewport.width;

    canvas.height =
        viewport.height;


    await page.render({

        canvasContext:
            context,

        viewport:
            viewport

    }).promise;


    const language =
        getOCRLanguage();


    const result =
        await Tesseract.recognize(

            canvas,

            language,

            {

                logger:
                    message => {

                        if (
                            message.status ===
                            "recognizing text"
                        ) {

                            const percent =
                                Math.round(
                                    message.progress *
                                    100
                                );

                            statusText.textContent =
                                `OCR ${percent}%`;

                        }

                    }

            }

        );


    return result.data.text;

}


/* -------------------------------------------------------
   IMAGE PROCESSING
------------------------------------------------------- */

async function processImage(file) {

    totalPages.textContent =
        "1";

    currentPage.textContent =
        "1";

    processingMode.textContent =
        "OCR";


    updateProgress(
        20,
        "Loading image..."
    );


    const image =
        await loadImage(file);


    updateProgress(
        40,
        "Running OCR..."
    );


    const language =
        getOCRLanguage();


    const result =
        await Tesseract.recognize(

            image,

            language,

            {

                logger:
                    message => {

                        if (
                            message.status ===
                            "recognizing text"
                        ) {

                            const percent =
                                Math.round(
                                    message.progress *
                                    100
                                );

                            updateProgress(
                                40 +
                                percent * 0.5,

                                `OCR ${percent}%`
                            );

                        }

                    }

            }

        );


    const text =
        cleanText(
            result.data.text
        );


    processedPages.push({

        page: 1,

        text: text,

        method: "ocr"

    });


    updatePreview(
        text
    );


    updateProgress(
        100,
        "Image processing complete"
    );

}


/* -------------------------------------------------------
   LOAD IMAGE
------------------------------------------------------- */

function loadImage(file) {

    return new Promise(
        (resolve, reject) => {

            const image =
                new Image();

            image.onload =
                () => resolve(image);

            image.onerror =
                reject;

            image.src =
                URL.createObjectURL(
                    file
                );

        }
    );

}


/* -------------------------------------------------------
   OCR LANGUAGE
------------------------------------------------------- */

function getOCRLanguage() {

    const selected =
        languageSelect.value;


    if (
        selected === "auto"
    ) {

        /*
           For Version 1 we use English
           when Auto is selected.

           Automatic multilingual OCR
           will be added in Version 2.
        */

        return "eng";

    }


    return selected;

}


/* -------------------------------------------------------
   CLEAN TEXT
------------------------------------------------------- */

function cleanText(text) {

    if (!text)
        return "";


    /*
       Normalize line endings
    */

    text =
        text.replace(
            /\r/g,
            "\n"
        );


    /*
       Remove excessive spaces
    */

    text =
        text.replace(
            /[ \t]+/g,
            " "
        );


    /*
       Remove excessive blank lines
    */

    text =
        text.replace(
            /\n{3,}/g,
            "\n\n"
        );


    /*
       Join words broken by
       hyphen + newline
    */

    text =
        text.replace(
            /(\S)-\n(\S)/g,
            "$1$2"
        );


    return text.trim();

}


/* -------------------------------------------------------
   UPDATE PROGRESS
------------------------------------------------------- */

function updateProgress(
    percent,
    message
) {

    percent =
        Math.max(
            0,
            Math.min(
                100,
                percent
            )
        );


    progressBar.style.width =
        percent + "%";


    progressPercent.textContent =
        Math.round(percent) + "%";


    statusText.textContent =
        message;

}


/* -------------------------------------------------------
   UPDATE TEXT PREVIEW
------------------------------------------------------- */

function updatePreview(text) {

    textPreview.value =
        text;

    characterCount.textContent =
        `${text.length.toLocaleString()} characters`;

    /*
       Always show latest content
    */

    textPreview.scrollTop =
        textPreview.scrollHeight;

}


/* -------------------------------------------------------
   CREATE JSON
------------------------------------------------------- */

function createJSON() {

    const title =
        document.getElementById(
            "bookTitle"
        ).value.trim();


    const author =
        document.getElementById(
            "bookAuthor"
        ).value.trim();


    const language =
        languageSelect.value;


    const bookId =
        createBookId(
            title ||
            selectedFile.name
        );


    finalJSON = {

        rag_schema:
            "EPRASHALA-RAG-1.0",


        document: {

            id:
                bookId,

            title:
                title ||
                selectedFile.name,

            author:
                author,

            language:
                language,

            source_file:
                selectedFile.name,

            total_pages:
                processedPages.length

        },


        processing: {

            engine:
                "Eprashala Book Scanner",

            pdf_engine:
                "PDF.js",

            ocr_engine:
                "Tesseract.js",

            ocr_mode:
                ocrModeSelect.value,

            created_at:
                new Date().toISOString()

        },


        pages:
            processedPages

    };


    jsonStatus.innerHTML =
        `
        <strong>JSON ready.</strong><br>
        ${processedPages.length} pages processed.<br>
        ${JSON.stringify(finalJSON).length.toLocaleString()}
        characters generated.
        `;


    downloadButton.disabled =
        false;

}


/* -------------------------------------------------------
   BOOK ID
------------------------------------------------------- */

function createBookId(name) {

    return name

        .toLowerCase()

        .replace(
            /[^a-z0-9]+/g,
            "_"
        )

        .replace(
            /^_+|_+$/g,
            ""
        )

        .substring(
            0,
            50
        );

}


/* -------------------------------------------------------
   DOWNLOAD JSON
------------------------------------------------------- */

downloadButton.addEventListener(
    "click",
    () => {

        if (!finalJSON)
            return;


        const json =
            JSON.stringify(
                finalJSON,
                null,
                2
            );


        const blob =
            new Blob(
                [json],
                {
                    type:
                        "application/json"
                }
            );


        const url =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );


        link.href =
            url;


        const name =
            finalJSON.document.id;


        link.download =
            `${name}-rag.json`;


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        URL.revokeObjectURL(
            url
        );

    }
);