Wikipedia History Visualization
===============================

Experimental visualization of Wikipedia page history with the [Raphael.js](http://raphaeljs.com/) framwork, done for an article.
See sample output below.

![Screenshot](https://raw.githubusercontent.com/karmi/wikipedia_history_viz/master/screenshot.png)

How it works
-------------

There are some rough, procedural, stupid, etc Ruby scripts in the `scripts` folder, have a look and you can try it out.

First, the `wikipage_to_git.rb` script loads XML export with Wikipedia history (see comments inside how to get it) into a Git repository.

Then, `git_to_*.rb` scripts converts some interesting information from the data, which we can very conveniently grab via Git commands, into JSON.

And, lastly, `timeline.html` loads the JSON and displays it.

---

(c) Karel Minarik ([www.karmi.cz](http://www.karmi.cz)). Published under MIT license.
