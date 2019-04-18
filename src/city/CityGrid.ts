import { vec2, mat4, vec3 } from "gl-matrix";
import Building from "./Building";
import TextureHelper from '../lsystem/TextureHelper';

// Create high-resolution 2D grid that spans your entire scene
class CityGrid {
    width: number;
    height: number;
    grid: number[][] = [];
    tallBuildingColor: vec3 = vec3.fromValues(69.0 / 255.0, 88.0 / 255.0, 121.0 / 255.0);
    mediumBuildingColor: vec3 = vec3.fromValues(213.0 / 255.0, 222.0 / 255.0, 224.0 / 255.0);
    shortBuildingColor: vec3 = vec3.fromValues(219.0 / 255.0, 184.0 / 255.0, 190.0 / 255.0);

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.initializeGrid(width, height);
    }

    initializeGrid(width: number, height: number) {
        for (let i = 0; i < width; i++) {
            this.grid[i] = [];
            for (let j = 0; j < height; j++) {
                this.grid[i][j] = 0;
            }
        }
    }

    rasterize() {
        // "Rasterize" every road in this grid with an adjustable 
        // line thickness to demarcate areas where buildings cannot be placed

        for (let i = 0; i < this.width; i++) {
            for (let j = 0; j < this.height; j++) {
                // Create a simple checkered grid to represent roads
                if (i % 8 == 0 || j % 8 == 0) {
                    this.grid[i][j] = 1; // Road case
                } else {
                    this.grid[i][j] = 0; // Not a road
                }
            }
        }

        console.log('Rasterized grid of size: ' + this.grid.length);
    }

    generateValidPoints() :  Array<vec2> {
        let outputPoints = new Array<vec2>();

        for (let i = 0; i < this.width; i++) {
            for (let j = 0; j < this.height; j++) {
                // Check if point belongs in grid using noise function
                let noise = Math.random();
                if (noise > 0.8 && this.grid[i][j] != 1 && this.neighborsAreNotRoads(i, j)) {
                    // If noise is above a threshold and there is not already a road, set
                    // down a building
                    let gridCenter: vec2 = vec2.fromValues(this.width / 2, this.height / 2);
                    let distanceFromCenter: number = vec2.distance(vec2.fromValues(i, j), gridCenter);
                    if (i > 75 && j > 65 && j <= 80) {
                        continue;
                    } 
                    if (i > 85 && j > 80) {
                        continue;
                    } 
                    if (i > 85 && j > 40 && j <= 62) {
                        continue;
                    }
                    if (i > 68 && i < 87 && j > 8 && j <= 30) {
                        continue;
                    }
                    if (distanceFromCenter > this.width / 2) {
                        // If far from city center, less likely to have buildings
                        if (noise > 0.97) {
                            this.grid[i][j] = 2;
                        }
                    } else {
                        this.grid[i][j] = 2;
                    }
                }
            }
        }

        return outputPoints;
    }

    neighborsAreNotRoads(x: number, y: number) : boolean {
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                let newX = x + i;
                let newY = y + j;
                if (newX >= 0 && newY >= 0 && newX < this.width && newY < this.height) {
                    if (this.grid[newX][newY] == 1) {
                        // If this is a road, return false
                        return false;
                    }
                }
            }
        }
        return true;
    }

    setGridVBO() : any {
        let col1Array: number[] = [];
	    let col2Array: number[] = [];
	    let col3Array: number[] = [];
	    let col4Array: number[] = [];
	    let colorsArray: number[] = [];

        for (let i: number = 0; i < this.width; i++) {
            for (let j: number = 0; j < this.height; j++) {
                let cellType = this.grid[i][j];
                if (cellType != 0) {
                    // Rotate the squares by 90 degrees so they lie flat on the plane
                    let rotation90: mat4 = mat4.create();
                    let translatedMat: mat4 = mat4.create();
                    translatedMat[12] = i - this.width / 2;
                    translatedMat[14] = j - this.height / 2;
                    mat4.rotateX(rotation90, translatedMat, 90.0 * Math.PI / 180.0);

                    col1Array.push(rotation90[0]);
                    col1Array.push(rotation90[1]);
                    col1Array.push(rotation90[2]);
                    col1Array.push(rotation90[3]);

                    col2Array.push(rotation90[4]);
                    col2Array.push(rotation90[5]);
                    col2Array.push(rotation90[6]);
                    col2Array.push(rotation90[7]);

                    col3Array.push(rotation90[8]);
                    col3Array.push(rotation90[9]);
                    col3Array.push(rotation90[10]);
                    col3Array.push(rotation90[11]);
            
                    col4Array.push(rotation90[12]);
                    col4Array.push(rotation90[13]);
                    col4Array.push(rotation90[14]);
                    col4Array.push(rotation90[15]);

                    if (cellType == 1) {
                        // Road - red
                        //0.36, 0.36, 0.37
                        colorsArray.push(0.56);
                        colorsArray.push(0.56);
                        colorsArray.push(0.57);
                        colorsArray.push(1);
                    }

                    if (cellType == 2) {
                        // Building - nothing (for final output)
                        colorsArray.push(0);
                        colorsArray.push(0);
                        colorsArray.push(0);
                        colorsArray.push(0);
                    }

                    if (cellType == 3) {
                        // Water - clear
                        colorsArray.push(103.0 / 255.0);
                        colorsArray.push(196.0 / 255.0);
                        colorsArray.push(214.0 / 255.0);
                        colorsArray.push(0.4);
                    }
                }
            }
            
        }

        let col1: Float32Array = new Float32Array(col1Array);
        let col2: Float32Array = new Float32Array(col2Array);
        let col3: Float32Array = new Float32Array(col3Array);
        let col4: Float32Array = new Float32Array(col4Array);
        let colors: Float32Array = new Float32Array(colorsArray);

        let output: any = {};
        output.transform1Array = col1;
        output.transform2Array = col2;
        output.transform3Array = col3;
        output.transform4Array = col4;
        output.colorsArray = colors;

        return output;
    }

    setBuildingVBO() {
        let col1Array: number[] = [];
	    let col2Array: number[] = [];
	    let col3Array: number[] = [];
	    let col4Array: number[] = [];
        let colorsArray: number[] = [];
        
        for (let i: number = 0; i < this.width; i++) {
            for (let j: number = 0; j < this.height; j++) {
                let cellType = this.grid[i][j];
                if (cellType == 2) {
                    // If the cell type is building, create a building polygon
                    let building = new Building(i, j, this.width, this.height);
                    let height = building.create();
                    let transforms: mat4[] = building.getTransforms();

                    for (let k = 0; k < transforms.length; k++) {
                        let T: mat4 = transforms[k];
                        col1Array.push(T[0]);
                        col1Array.push(T[1]);
                        col1Array.push(T[2]);
                        col1Array.push(T[3]);

                        col2Array.push(T[4]);
                        col2Array.push(T[5]);
                        col2Array.push(T[6]);
                        col2Array.push(T[7]);

                        col3Array.push(T[8]);
                        col3Array.push(T[9]);
                        col3Array.push(T[10]);
                        col3Array.push(T[11]);
                
                        col4Array.push(T[12]);
                        col4Array.push(T[13]);
                        col4Array.push(T[14]);
                        col4Array.push(T[15]);

                        let color: vec3;
                        if (height > 8.0) {
                            color = this.tallBuildingColor;
                        } else if (height > 2.5) {
                            color = this.mediumBuildingColor;
                        } else {
                            color = this.shortBuildingColor;
                        }
                        colorsArray.push(color[0]);
                        colorsArray.push(color[1]);
                        colorsArray.push(color[2]);
                        colorsArray.push(1);
                    }
                    
                }
            }
        }
        let col1: Float32Array = new Float32Array(col1Array);
        let col2: Float32Array = new Float32Array(col2Array);
        let col3: Float32Array = new Float32Array(col3Array);
        let col4: Float32Array = new Float32Array(col4Array);
        let colors: Float32Array = new Float32Array(colorsArray);

        let output: any = {};
        output.transform1Array = col1;
        output.transform2Array = col2;
        output.transform3Array = col3;
        output.transform4Array = col4;
        output.colorsArray = colors;

        return output;
    }
}

export default CityGrid;