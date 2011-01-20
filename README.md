MooParallax
===========

A MooTools port of jParallax, seeing as I couldn't find one.

see jParallax for examples:
http://webdev.stephband.info/parallax.html

How to Use
----------

Assuming an HTML structure of:

	#HTML
	
		<div class="parallax">
			<img src="images/parallax_drops/0.png" alt="" style="width:978px; height:325px;"/>
			<img src="images/parallax_drops/1.png" alt="" style="width:987px; height:328px;"/>
			<img src="images/parallax_drops/2.png" alt="" style="width:1001px; height:333px;"/>
			<img src="images/parallax_drops/3.png" alt="" style="width:1031px; height:343px;"/>
			<img src="images/parallax_drops/4.png" alt="" style="width:1067px; height:355px;"/>
			<img src="images/parallax_drops/5.png" alt="" style="width:1120px; height:373px;"/>
			<img src="images/parallax_drops/6.png" alt="" style="width:1200px; height:400px;"/>
		</div>
		
Then instantiate the class as follows:

	#JS
		new MooParallax($(document.body).getElements('.parallax'));
