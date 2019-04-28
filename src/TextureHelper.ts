export default class TextureHelper {
	texture: Uint8Array;
	width: number;
	height: number;

	constructor(texture: Uint8Array, width: number, height: number) {
		this.texture = texture;
		this.width = width;
		this.height = height;
	}

	// Returns value between 0 and 1 for the given x, y texture coordinate for water elevation
	getWater(x: number, y: number) {
		let xpos = Math.floor(x);
    let ypos = Math.floor(y);
    let offset = 0;
    let index = ypos * 2000 * 4 + xpos * 4 + offset;
    return this.texture[index] / 255;
	}

	getElevation(x: number, y: number) : number {
		// Convert to pixel space 
		x += 1.0;
		y += 1.0;
		x *= 0.5;
		y *= 0.5;
		x *= this.width;
		y *= this.height;
		x = Math.floor(x);
		y = Math.floor(y);

		let blue: number = this.texture[4.0 * (x + this.width * y) + 2.0];
		let green: number = this.texture[4.0 * (x + this.width * y) + 1.0];

		if (blue > green){
				return 0;
		} else {
				return 1;
		}
	}

	getPopulation(x: number, y: number) : number {
		// Convert to pixel space 
		x += 1.0;
		y += 1.0;
		x *= 0.5;
		y *= 0.5;
		x *= this.width;
		y *= this.height;
		x = Math.floor(x);
		y = Math.floor(y);

		let population: number = this.texture[4.0 * (x + this.width * y) + 3.0];
		return population;
	}

}