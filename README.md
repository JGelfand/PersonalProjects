# PersonalProjects
Some small projects I might want access to on multiple machines. They are published under an open source license, mostly because I can't make the repo private.

systemsolver.js is a linear system solver written in javascript. It interprets input in a reasonably forgiving manner. It allows use of parentheses, implicit or explicit multiplication, multiple equations chained together with x=y=z, doesn't make you do anything to declare how many variables or equations you will have beforehand, and allows the use of any single alphabetic character as a variable name.

It currently solves the system via simple Gaussian elimination. I want to eventually make it solve via LU decomposition into forward and backward substitution where applicable, and possibly add support for factoring polynomials with no more than two non-rational roots.

To see it in action, simply open systemsolver/example.html. Type equations (eg 5x+(2/3)y=2) into the upper left box, then click the "Add to system" button. It should either display the equation in the bottom right "System:" box, or an error message in the bottom left box. Once you feel that you have added enough equations, hit "Solve" under the bottom left box to solve the entire system, and display the result in the bottom left box. You can remove equations from your current system by refreshing the page, hitting the "reset" button, or typing a line number into the upper right box and hitting the "remove line" button.
