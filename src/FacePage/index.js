import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { connect } from "react-redux";
import mapStateToProps from './mapStateToProps';
import mapDispatchToProps from './mapDispatchToProps';
import Camera from './Camera';
import Canva from './Canva';
import * as faceapi from 'face-api.js';


class FacePage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            controller: 'game',
            loading: false,
            authorized: false,
            checkAutorization: true,
            positionIndex: 0,
            filterAnimal: 'filtro1',
            imageFilter: new Image(),
            showFilter: true,
             ejeXe: 0,
            ejeYe:0,
        }
        this.setVideoHandler = this.setVideoHandler.bind(this);
        this.isModelLoaded = this.isModelLoaded.bind(this);
        this.switchFilter = this.switchFilter.bind(this);
    }

    async setVideoHandler() {
        if (this.isModelLoaded() !== undefined) {
            try {
                let result = await faceapi.detectSingleFace(this.props.video.current, this.props.detector_options).withFaceLandmarks().withFaceExpressions().withAgeAndGender();
                if (result !== undefined) {
                    console.log("face detected", 1);
                    const dims = faceapi.matchDimensions(this.props.canvas.current, this.props.video.current, true);
                    const resizedResult = faceapi.resizeResults(result, dims);
                    faceapi.draw.drawDetections(this.props.canvas.current, resizedResult);
                    faceapi.draw.drawFaceLandmarks(this.props.canvas.current, resizedResult);

                    const currentCanvas = ReactDOM.findDOMNode(this.props.canvas.current);
                    var canvasElement = currentCanvas.getContext("2d");
                    this.addFilter(canvasElement, result);
                    this.addBoxIndexOfLandmark(canvasElement, result.landmarks.positions[this.state.positionIndex]);
                    this.addBackgroundInformation(canvasElement, result);
                    this.addGenderAndAgeInformation(canvasElement, result);
                    this.addEmotionInformation(canvasElement, resizedResult, result);

                } else {
                    console.log("face detected", 1);
                }
            } catch (exception) {
                console.log(exception);
            }
        }
        setTimeout(() => this.setVideoHandler());
    }

    addBoxIndexOfLandmark(canvasElement, landkmarkPosition) {
        let width = 10, height = 10;
        canvasElement.setTransform(1, 0, 0, 1, 0, 0);
        canvasElement.fillStyle = 'rgb(255, 87, 51)';
        canvasElement.fillRect(landkmarkPosition.x, landkmarkPosition.y, width, height);
        canvasElement.closePath();
        canvasElement.setTransform(1, 0, 0, 1, 0, 0);
    }

    addBackgroundInformation(canvasElement, result) {
        let positionX = result.landmarks.positions[8].x,
            positionY = result.landmarks.positions[8].y + 10;
        canvasElement.fillStyle = "black";
        canvasElement.fillRect(positionX - 45, positionY - 12, 90, 45);
    }

    addGenderAndAgeInformation(canvasElement, result) {
        // Edad y Sexo
        canvasElement.font = "10px Comic Sans MS";
        //canvasElement.font="30px Arial";
        canvasElement.fillStyle = "red";
        let positionX = result.landmarks.positions[8].x,
            positionY = result.landmarks.positions[8].y + 10,
            gender = (result.gender) === "male" ? "Hombre" : "Mujer",
            age = "Edad: " + result.age.toFixed();
        gender = "Sexo: " + gender;

        canvasElement.textAlign = "center";
        canvasElement.fillStyle = "white";
        canvasElement.fillText(gender, positionX, positionY);
        canvasElement.fillText(age, positionX, positionY + 15);
    }

    addEmotionInformation(canvasElement, resizedResult, result) {
        const expressions = resizedResult.expressions;
        const maxValue = Math.max(...Object.values(expressions));
        let emotion = Object.keys(expressions).filter(
            item => expressions[item] === maxValue
        );
        emotion = emotion[0];
        emotion = (emotion === "happy") ? "feliz" : emotion;
        emotion = (emotion === "neutral") ? "neutral" : emotion;
        emotion = (emotion === "angry") ? "enojado" : emotion;
        emotion = (emotion === "sad") ? "triste" : emotion;
        emotion = (emotion === "surprised") ? "sorprendido" : emotion;
        emotion = (emotion === "fearful") ? "temeroso" : emotion;

        let positionX = result.landmarks.positions[8].x,
            positionY = result.landmarks.positions[8].y + 10;
        canvasElement.fillText("Emocion: " + emotion, positionX, positionY + 30);
    }

    addFilter(canvasElement, result) {
        let startIndex = 0, endIndex = 16, ajustX = (this.state.ejeXe), ajustY = (this.state.ejeYe);
        let positionX1 = result.landmarks.positions[startIndex].x - ajustX,
            positionY1 = result.landmarks.positions[startIndex].y + ajustY,
            positionX2 = result.landmarks.positions[endIndex].x + ajustX,
            positionY2 = result.landmarks.positions[endIndex].y + ajustY,
            m = ((positionY2 - positionY1) / (positionX2 - positionX1)) * 100;

        let width = positionX2 - positionX1,
            height = width * 1.8;

        positionY1 -= (height / 4);
        positionY2 -= (height / 4);

        var TO_RADIANS = Math.PI / 180,
            angleInRad = (m / 2.5) * TO_RADIANS;
        console.log("TO_RADIANS", TO_RADIANS);

        canvasElement.setTransform(1, 0, 0, 1, 0, 0);
        canvasElement.translate(positionX1, positionY1 - 50);
        canvasElement.rotate(angleInRad);
        canvasElement.drawImage(this.state.imageFilter, 0, 0, width, height);
        /*canvasElement.translate(positionX1 ,positionY1) 
        canvasElement.translate(1,0,0,0,positionX1+(width/2),positionY1); 
        canvasElement.rotate(angleInRad);    */
        //canvasElement.drawImage(this.state.imageFilter,0,0,width,height);
        //canvasElement.restore();
        canvasElement.setTransform(1, 0, 0, 1, 0, 0);
        //this.rotateAndPaintImage(canvasElement, this.state.imageFilter, angleInRad, positionX1, positionY1,20,0 );
    }

    rotateAndPaintImage(context, image, angleInRad, positionX, positionY, axisX, axisY) {
        context.translate(positionX, positionY);
        context.rotate(angleInRad);
        context.drawImage(image, -axisX, -axisY);
        context.rotate(-angleInRad);
        context.translate(-positionX, -positionY);
    }

    isModelLoaded() {
        if (this.props.selected_face_detector === this.props.SSD_MOBILENETV1) return faceapi.nets.ssdMobilenetv1.params;
        if (this.props.selected_face_detector === this.props.TINY_FACE_DETECTOR) return faceapi.nets.tinyFaceDetector.params;
    }


    async componentDidMount() {
        console.log("height: " + window.screen.height + ", width: " + window.screen.width);

        // obtener parametros de configuracion y asignar el modelo que vamos a usar para reconocer rostros
        this.setDetectorOptions();
        this.props.SET_VIDEO_HANDLER_IN_GAME_FACENET(this.setVideoHandler);

        // asignar los archivos del model a face-api
        let modelFolder = "/models";

        // se realizan las variables donde se guardan las direcciones donde se encuentra el filtro 

        let animal = { 
            filtro1: '/filter/abeja.svg',
            filtro2: '/filter/coneja.svg', 
            filtro3: '/filter/conejo.svg',
            filtro4: '/filter/elefante.svg',
            filtro5: '/filter/foca.svg',
            filtro6: '/filter/gato.svg',
            filtro7: '/filter/iguana.svg',
            filtro8: '/filter/leon.svg',
            filtro9: '/filter/mono.svg',
            filtro10: '/filter/oveja.svg',
            filtro11: '/filter/panda.svg',
            filtro12: '/filter/perro.svg',
            filtro13: '/filter/puerco.svg',
            filtro14: '/filter/vaca.svg',
            filtro15: '/filter/zorro.svg'
         }

        let valor = 'filtro1'
        try {
            await faceapi.loadFaceLandmarkModel(modelFolder);
            await faceapi.nets.ageGenderNet.loadFromUri(modelFolder);
            await faceapi.nets.faceExpressionNet.loadFromUri(modelFolder);
            if (this.props.selected_face_detector === this.props.SSD_MOBILENETV1) await faceapi.nets.ssdMobilenetv1.loadFromUri(modelFolder);
            if (this.props.selected_face_detector === this.props.TINY_FACE_DETECTOR) await faceapi.nets.tinyFaceDetector.load(modelFolder);
                // se carga el valor de las variables para darle la dirección del filtro
            this.state.imageFilter.src = (animal[valor]);
            this.state.imageFilter.onload = function () {
                console.log("image is loaded");

            }
        } catch (exception) {
            console.log("exception", exception);
        }
    }


    async componentDidUpdate() {
        console.log('El estado ha cambiado')
        this.props.SET_VIDEO_HANDLER_IN_GAME_FACENET(this.setVideoHandler);

        // asignar los archivos del model a face-api
        let modelFolder = "/models";
        // se declaran las variables de los filtros para que se puede cargar 
        let animal = { 
            filtro1: '/filter/abeja.svg',
            filtro2: '/filter/coneja.svg', 
            filtro3: '/filter/conejo.svg',
            filtro4: '/filter/elefante.svg',
            filtro5: '/filter/foca.svg',
            filtro6: '/filter/gato.svg',
            filtro7: '/filter/iguana.svg',
            filtro8: '/filter/leon.svg',
            filtro9: '/filter/mono.svg',
            filtro10: '/filter/oveja.svg',
            filtro11: '/filter/panda.svg',
            filtro12: '/filter/perro.svg',
            filtro13: '/filter/puerco.svg',
            filtro14: '/filter/vaca.svg',
            filtro15: '/filter/zorro.svg'
         }


        let valor = this.state.filterAnimal
        try {
            await faceapi.loadFaceLandmarkModel(modelFolder);
            await faceapi.nets.ageGenderNet.loadFromUri(modelFolder);
            await faceapi.nets.faceExpressionNet.loadFromUri(modelFolder);
            if (this.props.selected_face_detector === this.props.SSD_MOBILENETV1) await faceapi.nets.ssdMobilenetv1.loadFromUri(modelFolder);
            if (this.props.selected_face_detector === this.props.TINY_FACE_DETECTOR) await faceapi.nets.tinyFaceDetector.load(modelFolder);

            this.state.imageFilter.src = (animal[valor]);
            this.state.imageFilter.onload = function () {
                console.log("image is loaded");

            }
        } catch (exception) {
            console.log("exception", exception);
        }

    }
    setDetectorOptions() {
        let minConfidence = this.props.min_confidence,
            inputSize = this.props.input_size,
            scoreThreshold = this.props.score_threshold;

        // identificar el modelo previsamente entrenado para reconocer rostos.
        // el modelo por defecto es tiny_face_detector
        let options = this.props.selected_face_detector === this.props.SSD_MOBILENETV1
            ? new faceapi.SsdMobilenetv1Options({ minConfidence })
            : new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold });
        this.props.SET_DETECTOR_OPTIONS_IN_GAME_FACENET(options);
    }

    switchFilter(e) {


        this.setState({ filterAnimal: e.target.value, ejeXe: 0, ejeYe:0 })
        console.log(this.state.filterAnimal)
    }

    render() {
        return (
            <div>
                <Camera />
                <Canva />

                <input type="number"
                    style={{ marginLeft: 1000 }}
                    value={this.state.positionIndex}
                    onChange={(event) => { this.setState({ positionIndex: event.target.value }) }} />


                <div className="buscador row">
            <div className="col s12 m8 offset-2">
                <form>
                    <h2>Elije tu filtro</h2>
                    <div className="input-field col s12 m8">
                        <select
                           onChange={(event)=>{this.setState({filterAnimal: event.target.value})}}
                           value={this.state.filterAnimal}
                        >
                           
                            <option value='filtro1' onClick={(event) => { this.setState({  ejeX: 50, ejeYe:80 }) }}>Abeja</option>
                            <option value='filtro2'>Coneja</option>
                            <option value='filtro3'>Conejo</option>
                            <option value='filtro4'>Elefante</option>
                            <option value='filtro5'>Foca</option>
                            <option value='filtro6'>Gato</option>
                            <option value='filtro7'>Iguana</option>
                            <option value='filtro8'>Leon</option>
                            <option value='filtro9'>Mono</option>
                            <option value='filtro10'>Oveja</option>
                            <option value='filtro11'>Panda</option>
                            <option value='filtro12'>Perro</option>
                            <option value='filtro13'>Puerco</option>
                            <option value='filtro14'>Vaca</option>
                            <option value='filtro15'>Zorro</option>

                            


                        </select>
                    </div>
                </form>
            </div>
        </div>           
        
            </div>
        )
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(FacePage);