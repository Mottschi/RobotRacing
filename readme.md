# RobotRacing

## About the Game
In RobotRacing, you will give commands to a little robot, trying to guide him through a landscape and to the finish flags ![finish flags](/assets/images/flag2.png). Make sure to avoid running into any obstacles on your way!

This game was developed within one week as my first project during the [Ironhack](https://www.ironhack.com/en) web development bootcamp.

### Inspiration

The idea of having a game with a robot being controlled by chosing from randomly selected inputs was inspired by [RoboRally](https://boardgamegeek.com/boardgame/18/roborally).

## How to play
RobotRacing is a turn-based game. Every turn, you will roll a number of six-sided dice, which will each display any one of the following symbols:

### Move One
![Move One](/assets/images/icons/1-solid.png)
Choosing this option will make your robot move one step in the direction it is currently facing.

### Move Two
![Move Two](/assets/images/icons/2-solid.png)
Choosing this option will make your robot move two steps in the direction it is currently facing.


### Move Three
![Move Three](/assets/images/icons/3-solid.png)
Choosing this option will make your robot move three steps in the direction it is currently facing.


### Step Backwards
![Move Backward](/assets/images/icons/arrow-down-long-solid.png)
Choosing this option will make your robot move one step in the direction away from where it is currently facing, without changing that direction.


### Turn Left
![Turn Left](/assets/images/icons/arrow-rotate-left-solid.png)
Choosing this option will make your robot turn 90 degrees to the left.


### Turn Right
![Turn Right](/assets/images/icons/arrow-rotate-right-solid.png)
Choosing this option will make your robot turn 90 degrees to the right.

## Movement
Each turn you will have to pick three of the movement-options you are presented with, like this:

![Movement UI](/assets/images/movement.png)

As you pick your moves, they will be added to the queue below. The chosen moves from the queue will be executed in the order you picked them. **Once picked, there is no way to reverse that decision**, so choose carefully!

## Terrain
The map is diviged into a grid of tiles with different terrain.

### Grass 
![Grass](/assets/images/tiles/Grass%20Texture%201.jpg) 
![Grass](/assets/images/tiles/Grass%20Texture%202.jpg) 
![Grass](/assets/images/tiles/Grass%20Texture%204.jpg) 

Your robot can move through this terrain without encountering any problems.

### Mountains/Rock
![Mountain/Rock](/assets/images/tiles/rock3-small.png)
![Mluntain/Rock](/assets/images/tiles/rock4-small.png)

Your robot is unable to enter this terrain. Trying to do so will have your robot come to a stop right in front of the tile with the mountain area, while taking one point of damage. Your robot will continue with any remaining moves from that tile on, so be careful not to run into the same mountain again and again, repeatedly taking damage!

### Water
![Water](/assets/images/tiles/water-small.png)
![Water](/assets/images/tiles/water2-small.png)

Your robot can technically enter this terrain, but will drown. That will cause him to reset - he will be placed back at the location where he started the current turn, skipping any remaining moves that turn, while also taking one point of damage!

### Lava
![Lava](/assets/images/tiles/lava.png)

Your robot can technically enter this terrain, but will be destroyed when doing so, losing all remaining lifes and thus, the game!

## The finish-line
![Finish-flag](/assets/images/flag2.png)

When you end a move on the tile holding this flag, you will complete the current map. The game will grant you one extra life (up to a maximum of 5 life) and move on to the next map.

## Endless mode
The first 3 maps in this game will always be the same 3 maps, but after you complete all of these in order, you will reach the endless mode, where you will continue to be challenged by randomly generated maps until you finally run out of lifes.

***
## Credits

Game design, website design and the actual game programming by Sebastian Mottschall

### Contact
[GitHub](https://github.com/Mottschi)  
[LinkedIn](https://www.linkedin.com/in/sebastian-mottschall-1659b417a/)

## Acknowledgements & Attributions

### Images

#### Title Screen
Title Screen image created by [Dall-E 2](https://openai.com/dall-e-2/)

#### Sprites
Robot pack
by Kenney Vleugels for Kenney (www.kenney.nl)

[License (Creative Commons Zero, CC0)](http://creativecommons.org/publicdomain/zero/1.0/)

#### Tiles

##### Lava
Created by [davesch](https://opengameart.org/users/davesch) [Source](https://opengameart.org/content/16x16-and-animated-lava-tile-45-frames) Distributed under license: [CC0 1.0 Universal (CC0 1.0)
Public Domain Dedication](https://creativecommons.org/publicdomain/zero/1.0/)

##### Grass
Created by [Proxy Games](https://opengameart.org/users/proxy-games) [Source](https://opengameart.org/content/grass-texture-pack) Distributed under license: [CC0 1.0 Universal (CC0 1.0)
Public Domain Dedication](https://creativecommons.org/publicdomain/zero/1.0/)

##### Mountain
Downscaled version of Ground textures created by [musdasch](https://opengameart.org/users/musdasch) [Source](https://opengameart.org/content/ground-texture-set) Distributed under license: [CC0 1.0 Universal (CC0 1.0)
Public Domain Dedication](https://creativecommons.org/publicdomain/zero/1.0/)

##### Water
Downscaled version of [Water Textures](https://opengameart.org/content/3-live-proceduraly-generated-tiling-water-textures-512px-running-brushes) by [qubodup](https://opengameart.org/users/qubodup) Distributed under license: [CC0 1.0 Universal (CC0 1.0)
Public Domain Dedication](https://creativecommons.org/publicdomain/zero/1.0/)

### Fonts

#### FONT: Projects
Freeware font.
copyright � [Fenotypefaces](http://fenotype.com) 2002, Emil Bertell.


### Music
Royalty Free Stock Music by [Jordan Winslow](https://jordanwinslow.me)
All copyrights retained by Jordan Winslow

### Sound Effects
Free sound effects created by [GameSupplyGuy](https://itch.io/profile/gamesupply) on [itch.io](https://gamesupply.itch.io/200-space-sound-effects)

#### Dice Roll
Sound Effect from [Pixabay](https://pixabay.com/?utm_source=link-attribution&amp;utm_medium=referral&amp;utm_campaign=music&amp;utm_content=102706)

### Favicon
Robot icon (no changes made) created by Omara Abderraouf and distributed via CC Attribution license.
[Source](https://icon-icons.com/icon/robot/83633)
[License](https://creativecommons.org/licenses/by/4.0/)

***
## Play the game
[Click here](https://mottschi.github.io/ironhack-project-1-robot-race/) to play the game.

***

##  Reflections

- I tried to split the game logic from the interaction with the UI/Website, any DoM-manipulation used to display the game information is found in the UIController in the helper.js, while the actual game logic is found in game.js. Unfortunately, the code is still pretty

- The game uses a the [state pattern](https://gameprogrammingpatterns.com/state.html) to change between input and command execution states, as well as the map setup, completion, game over states, while the main game engine is simply keeping the game loop alive with calls to its update-method via a set interval. This was my first time implementing this pattern.

- The actual implementation is a bit messy, but given the circumstances (strict time limit for the project, first project of the bootcamp), I would say it works reasonably well.

### Possible Additions

There were a lot of ideas on my "would be nice to have" list that I did not get around to implementing. Some of the more interesting examples:

- 2 Player Mode
- Powerups to collect on the map (extra lifes, extra dice, dice with different movement options/distribution, temporary invulnerability)
- Time limit during the "choose your moves" phase to add some pressure.