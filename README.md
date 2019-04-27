# nonphotorealistic shader

## demo
https://anniesu1.github.io/nonphotorealistic-shader/

## write-up for milestone

hello, i'm sorry for the lack of progress on this milestone. i am definitely going to work hard on it during the remaining time! basically, i set up importing of textures and have outlined for myself a basic framework / pipeline to go about. i am currently stuck on:
* how to scatter particles throughout a 3d mesh

and i plan to work on, in the following order:
* drawing a brush stroke at each particle position
* to add complexity, at each particle position, give the particle where the brush will be the following brush attributes: stroke size, orientation, color, noise offset...and THEN drawing a stylized brush stroke
* z-depth sorting (in order to get a proper painter's algorithm in there) 
* note: i think i'm scrapping my original idea of doing a forgery of a spirited away gif because i'd rather have the artistic freedom to create something new. please let me know if there may be issues with me wanting to create my own custom scene ! and sorry for the tumultuousness. 

## resources
_papers_
- painterly rendering for animation by meier (3d) - http://www.eecs.umich.edu/courses/eecs498-2/papers/meier96.pdf
- painterly rendering with curved brush strokes of multiple sizes (for images only, not 3d) - https://www.mrl.nyu.edu/publications/painterly98/

_misc_
- cmu slides - http://graphics.cs.cmu.edu/nsp/course/15-462/Spring04/slides/21-npr.pdf
- computer vision techniques - https://www.cs.utah.edu/~shirley/papers/painting.pdf
- review of existing painterly approaches - https://onlinelibrary.wiley.com/doi/full/10.1002/cav.1435
- jhu slides - http://www.cs.jhu.edu/~cohen/RendTech99/Lectures/Painterly_Rendering.color.pdf
- database of painterly rendering resources - https://www.mrl.nyu.edu/projects/npr/

