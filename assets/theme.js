/*============================================================================
 Money Format
 - Shopify.format money is defined in option_selection.js.
 If that file is not included, it is redefined here.
 ==============================================================================*/
if ( ( typeof Shopify ) === 'undefined' ) {
	Shopify = {};
}
if ( ! Shopify.formatMoney ) {
	Shopify.formatMoney = function (cents, format) {
		var value = '',
			placeholderRegex = /\{\{\s*(\w+)\s*\}\}/,
			formatString = (format || this.money_format);

		if (typeof cents == 'string') {
			cents = cents.replace('.', '');
		}

		function defaultOption(opt, def) {
			return (typeof opt == 'undefined' ? def : opt);
		}

		function formatWithDelimiters(number, precision, thousands, decimal) {
			precision = defaultOption(precision, 2);
			thousands = defaultOption(thousands, ',');
			decimal = defaultOption(decimal, '.');

			if (isNaN(number) || number == null) {
				return 0;
			}

			number = (number / 100.0).toFixed(precision);

			var parts = number.split('.'),
				dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands),
				cents = parts[1] ? (decimal + parts[1]) : '';

			return dollars + cents;
		}

		switch (formatString.match(placeholderRegex)[1]) {
			case 'amount':
				value = formatWithDelimiters(cents, 2);
				break;
			case 'amount_no_decimals':
				value = formatWithDelimiters(cents, 0);
				break;
			case 'amount_with_comma_separator':
				value = formatWithDelimiters(cents, 2, '.', ',');
				break;
			case 'amount_no_decimals_with_comma_separator':
				value = formatWithDelimiters(cents, 0, '.', ',');
				break;
		}

		return formatString.replace(placeholderRegex, value);
	};
}

// Theme functions
window.theme = window.theme || {};

theme.Sections = function Sections() {
	this.constructors = {};
	this.instances = [];

	$( document )
		.on('shopify:section:load', this._onSectionLoad.bind( this ) )
		.on('shopify:section:unload', this._onSectionUnload.bind( this ) )
		.on('shopify:section:select', this._onSelect.bind( this ) )
		.on('shopify:section:deselect', this._onDeselect.bind( this ) )
		.on('shopify:section:reorder', this._onReorder.bind( this ) )
		.on('shopify:block:select', this._onBlockSelect.bind( this ) )
		.on('shopify:block:deselect', this._onBlockDeselect.bind( this ) );
};

theme.Sections.prototype = _.assignIn({}, theme.Sections.prototype, {
	_createInstance: function( container, constructor ) {
		var $container = $( container ),
			id         = $container.attr( 'data-section-id' ),
			type       = $container.attr( 'data-section-type' );

		constructor = constructor || this.constructors[type];

		if ( _.isUndefined( constructor ) ) {
			return;
		}

		var instance = _.assignIn( new constructor( container ), {
			id: id,
			type: type,
			container: container
		});

		this.instances.push( instance );
	},

	// A section has been added or re-rendered.
	_onSectionLoad: function( evt ) {
		var container = $( '[data-section-id]', evt.target )[0];
		if ( container ) {
			this._createInstance(container);
		}
	},

	// A section has been deleted or is being re-rendered.
	_onSectionUnload: function( evt ) {
		this.instances = _.filter( this.instances, function( instance ) {
			var isEventInstance = ( instance.id === evt.detail.sectionId );

			if ( isEventInstance ) {
				if ( _.isFunction(instance.onUnload ) ) {
					instance.onUnload( evt );
				}
			}

			return ! isEventInstance;
		});
	},

	// User has selected the section in the sidebar.
	_onSelect: function( evt ) {
		var instance = _.find( this.instances, function( instance ) {
			return instance.id === evt.detail.sectionId;
		});

		if ( ! _.isUndefined( instance ) && _.isFunction( instance.onSelect ) ) {
			instance.onSelect( evt );
		}
	},

	// User has deselected the section in the sidebar.
	_onDeselect: function( evt ) {
		var instance = _.find( this.instances, function( instance ) {
			return instance.id === evt.detail.sectionId;
		});

		if ( ! _.isUndefined( instance ) && _.isFunction( instance.onDeselect ) ) {
			instance.onDeselect( evt );
		}
	},

	// A section has been reordered.
	_onReorder: function( evt ) {
		var instance = _.find( this.instances, function( instance ) {
			return instance.id === evt.detail.sectionId;
		});

		if ( ! _.isUndefined( instance ) && _.isFunction( instance.onReorder ) ) {
			instance.onReorder( evt );
		}
	},

	// User has selected the block in the sidebar.
	_onBlockSelect: function( evt ) {
		var instance = _.find( this.instances, function( instance ) {
			return instance.id === evt.detail.sectionId;
		});

		if ( ! _.isUndefined( instance ) && _.isFunction( instance.onBlockSelect ) ) {
			instance.onBlockSelect( evt );
		}
	},

	// User has deselected the block in the sidebar.
	_onBlockDeselect: function( evt ) {
		var instance = _.find( this.instances, function( instance ) {
			return instance.id === evt.detail.sectionId;
		});

		if ( ! _.isUndefined( instance ) && _.isFunction( instance.onBlockDeselect ) ) {
			instance.onBlockDeselect( evt );
		}
	},

	register: function ( type, constructor ) {
		this.constructors[type] = constructor;

		$( '[data-section-type=' + type + ']' ).each(function ( index, container ) {
			this._createInstance( container, constructor );
		}.bind( this ) );
	}
});

theme.cacheSelectors = function () {
	theme.cache = {
		// General
		$html: $('html'),
		$body: $(document.body),

		// Section
		$slideshowWrapper: $( '.slick-slider:not(.manual-init)' ),

		// Navigation
		$navigation: $( '.nav' ),
		$mobileNavToggle: $( '.mobile-nav-trigger' ),
		$mobileSubNavToggle: $( '.mobile-nav__arrow' ),

		// Collection Pages
		$changeView: $('.change-view'),

		// Product
		$cartCount: $('.header__cart-count'),
	};
};

theme.multipleVariants = function (options) {
	var moneyFormat = options.money_format,
		variant = options.variant,
		selector = options.selector;

	// Selectors
	var $container        = $('.product-template__container'),
		$section_id       = $container.attr('data-section-id');
		$addToCart        = $( '.btn--atc' ),
		$productPrice     = $('#ProductPrice-' + $section_id),
		$comparePrice     = $('#ComparePrice-' + $section_id),
		$quantityElements = $('.quantity-selector, label + .js-qty'),
		$addToCartText    = $addToCart.children( 'span' ),
		$addToCartIcon    = $addToCart.children( 'i' );

	if ( variant ) {

		// Update variant image, if one is set
		if ( variant.featured_image ) {
			setTimeout( function() {
				$( '.product-single__thumbnails__item:not(.slick-cloned)[data-variant="' + variant.id + '"]' ).trigger( 'click' );
			});
		}

		// Select a valid variant if available
		if ( variant.available ) {
			// Available, enable the submit button, change text, show quantity elements
			$addToCart.removeClass( 'disabled' ).prop( 'disabled', false );
			$addToCartText.html("Add To Cart");
			$addToCartIcon.removeClass( 'fa-exclamation' ).addClass( 'fa-shopping-basket' );
			$quantityElements.show();
		} else {
			// Sold out, disable the submit button, change text, hide quantity elements
			$addToCart.addClass( 'disabled' ).prop( 'disabled', true );
			$addToCartText.html("Out of stock");
			$addToCartIcon.removeClass( 'fa-shopping-basket' ).addClass( 'fa-exclamation' );
			$quantityElements.hide();
		}

		// Regardless of stock, update the product price
		$productPrice.html( Shopify.formatMoney( variant.price, moneyFormat ) );

		// Also update and show the product's compare price if necessary
		if ( variant.compare_at_price > variant.price ) {
			$comparePrice.html( Shopify.formatMoney( variant.compare_at_price, moneyFormat ) ).show();
		} else {
			$comparePrice.hide();
		}

	} else {
		// The variant doesn't exist, disable submit button.
		// This may be an error or notice that a specific variant is not available.
		// To only show available variants, implement linked product options:
		//   - http://docs.shopify.com/manual/configuration/store-customization/advanced-navigation/linked-product-options
		$addToCart.addClass( 'disabled' ).prop( 'disabled', true );
		$addToCartText.html("Unavailable");
		$addToCartIcon.removeClass( 'fa-shopping-basket' ).addClass( 'fa-exclamation' );
		$quantityElements.hide();
	}
};

theme.switchImage = function (src, imgObject, el) {
	var $el = $(el);
	$el.attr('src', src);
};

theme.quickView = function () {
	$( 'body' ).on( 'click', '.product__action--quickview', function( e ) {
		var productURL = secure_url + $( this ).attr( 'href' ), data = { view: 'quickview' };

		$( this ).children( '.fa' ).removeClass( 'fa-eye' ).addClass( 'fa-spinner fa-pulse' );

		$.get( productURL, data, function( response ) {
			$.magnificPopup.open({
				items: {
					src: response,
					type: 'inline'
				}
			});

			$( '.product__action--quickview .fa' ).removeClass( 'fa-spinner fa-pulse' ).addClass( 'fa-eye' );

			$( '.slick' ).not( '.slick-initialized' ).slick();

			setTimeout( function () {
				$( '.product-single__image' ).imagesLoaded( function() {
					var imgHeight = $( '.product-single__image' ).outerHeight();
					$( '.product-single__content' ).css({
						'max-height': imgHeight,
						'overflow-y': 'auto'
					})
				});
			});
		});
		e.preventDefault();
		e.stopPropagation();
	});
}

theme.ajaxAddtocart = function ( id, quantity, modal ) {
	$( 'body' ).on( 'click', '.btn--ajax', function ( e ) {
		e.preventDefault();
		var _this    = $( this ),
			icon     = _this.children( '.fa' ),
			varianId = _this.parent().prev( '.product-form__variants' ).val(),
			quantity = parseInt( $( '.quantity__selector' ).val() );

		function remove_notice() {
			$( '.notice-cart' ).remove();
		}

		function hide_notice() {
			$( '.notice-cart' ).removeClass( 'active' );
		}

		// Remove old notice first
		remove_notice();

		// Make sure quantity is number
		quantity = ( isNaN( quantity ) ) ? 1 : quantity;

		// Add loading icon
		icon.removeClass( 'fa-shopping-basket' ).addClass( 'fa-spinner fa-pulse' );

		// Render status when add to cart is error
		Shopify.onError = function ( XMLHttpRequest, textStatus ) {
			var data = eval( '( ' + XMLHttpRequest.responseText + ' )' );
			if ( !!data.message ) {
				icon.removeClass( 'fa-spinner fa-pulse' ).addClass( 'fa-exclamation-triangle' );

				if ( ! _this.hasClass( 'btn--has-upsell' ) ) {
					$( 'body' ).addClass( 'mask' ).append( '<div class="notice-cart notice-cart--popup notice-cart--error"><div class="notice-cart__inner">' + data.description + '<span class="notice-cart__close icon-close"></span></div></div>' );
					setTimeout(function () {
						$( '.notice-cart' ).addClass('active' );
					}, 50);
				}

				// Hide notice after show 3s
				setTimeout(function () {
					hide_notice();
				}, 4000)
			}
		};

		// Add item to cart
		Shopify.addItem(varianId, quantity, function (data) {
			Shopify.getCart(function (all_data) {
				// Remove loading icon and add check icon for product added
				icon.removeClass( 'fa-spinner fa-pulse' ).addClass( 'fa-check' );

				if ( _this.hasClass( 'btn--ajax__upsell' ) ) { 
					$( '.btn--ajax__upsell' ).addClass( 'disabled' );
				} else {
					// Revert to icon shopping basket after 4s
					setTimeout(function () {
						icon.removeClass( 'fa-check' ).addClass( 'fa-shopping-basket' );
					}, 4000);
				}

				if ( _this.hasClass( 'btn--has-upsell' ) || _this.hasClass( 'btn--ajax__upsell' ) ) {
					$( '.notice-cart--upsell' ).addClass( 'active' );
				} else {
					// Add cart notice
					$( 'body' ).append( '<div class="notice-cart notice-cart--popup"><div class="notice-cart__inner"><form action="/cart" method="post" class="cart"><p><strong>' + data.product_title + '</strong> has been added to your cart.</p><div class="is-flex"><a href="/cart" class="btn btn--secondary">View cart</a><input type="submit" name="checkout" class="btn btn--primary" value="Check Out"></div></form><span class="notice-cart__close"><svg aria-hidden="true" focusable="false" role="presentation" class="icon icon-close" viewBox="0 0 37 40"><path d="M21.3 23l11-11c.8-.8.8-2 0-2.8-.8-.8-2-.8-2.8 0l-11 11-11-11c-.8-.8-2-.8-2.8 0-.8.8-.8 2 0 2.8l11 11-11 11c-.8.8-.8 2 0 2.8.4.4.9.6 1.4.6s1-.2 1.4-.6l11-11 11 11c.4.4.9.6 1.4.6s1-.2 1.4-.6c.8-.8.8-2 0-2.8l-11-11z"></path></svg></span></div></div>' );
					setTimeout(function () {
						$( '.notice-cart' ).addClass( 'active' );
					}, 50);
				}

				// Change cart count
				theme.cache.$cartCount.removeClass( 'hide-xs' ).text( all_data.item_count );

				// Hide notice after show 3s
				setTimeout(function () {
					hide_notice();
				}, 4000)
			});
		});

		// Remove cart notice
		if ( $( '.notice-cart' ).hasClass( 'active' ) ) {
			hide_notice()
		}
		$( 'body' ).on( 'click', '.notice-cart__close', function ( e ) {
			e.preventDefault();
			hide_notice();

			if ( _this.hasClass( 'btn--has-upsell' ) ) {
				$( '.notice-cart--upsell' ).removeClass( 'active' );
			}
		});
	});

	theme.sizeChart = function () {
		$( '.size-chart-open-popup' ).magnificPopup({
			type: 'inline',
			midClick: true
		});
	}
}

theme.InitSlickSlider = function () {

	var $el = $( '.slick-slider' ).not( '.manual-init' );
	var options = {};

	if ( $el.length > 0 ) {
		var items = $el.data( 'slick' ).slidesToShow;
		if (items > 1) {
			options = {
				responsive: [
					{
						breakpoint: 769,
						settings: {
							slidesToShow: 2
						}
					},
					{
						breakpoint: 481,
						settings: {
							slidesToShow: 1
						}
					}
				]
			}
		}
	}

	$el.slick(options);
}

theme.slickSlider = function (el) {
	var $el = $(el);
	var options = {
		prevArrow: "<button type=\"button\" class=\"slick-arrow slick-prev\"><i class=\"fa fa-angle-left\"></i></button>",
		nextArrow: "<button type=\"button\" class=\"slick-arrow slick-next\"><i class=\"fa fa-angle-right\"></i></button>",
	};

	var items = $el.data("slick").slidesToShow;
	if (items > 1) {
		options = {
			responsive: [
				{
					breakpoint: 769,
					settings: {
						slidesToShow: 2
					}
				},
				{
					breakpoint: 481,
					settings: {
						slidesToShow: 1
					}
				}
			]
		}
	}

	$el.slick(options);
}

theme.InitMasonry = function ( el ) {
	$( el ).imagesLoaded(function () {
		$( el ).isotope();
	});
}

theme.ToggleSearch = function () {
	$( '.header__search-trigger' ).click( function () {
		$( '.search-bar' ).toggleClass( 'active' ).slideToggle( 'fast' );
	})
	$( '.search-bar__close' ).click( function () {
		$( '.search-bar' ).removeClass( 'active' ).slideUp();
	})
}

theme.MobileNav = function () {
	theme.cache.$mobileNavToggle.click(function () {
		$(this).toggleClass('mobile-nav-toggle--open');
		$('.mobile-nav').toggleClass('mobile-nav--open').stop(true, true).slideToggle('fast');
	})

	theme.cache.$mobileSubNavToggle.on('click', function () {
		$(this).next('.mobile-nav__dropdown').stop(true, true).slideToggle().parent().toggleClass('mobile-nav__item--active');
	});
}

theme.Cart = function () {
	$( 'body' ).on( 'click', '.cart__edit--btn', function () {
		$( this ).toggleClass( 'cart__edit--active' );
		$( this ).parent().parent().next().next().toggleClass( 'cart__update--show' );
	});
}

var Instagram_Loaded = false;

theme.Instagram_Feed = function () {
	// Do not init multiple times
	if ( Instagram_Loaded == true ) return;

	var feed = $( '.instagram' );
	if (feed.length > 0) {
		var datas = feed.data();
		var target = $( '.instagram--' + datas.blockId );
		Instagram_Loaded = true;

		if ( target.length > 0 ) {
			$.ajax({
				type: "GET",
				dataType: "jsonp",
				url: 'https://api.instagram.com/v1/users/self/media/recent/?access_token=' + datas.accessToken,
				complete: function (response) {
					if ( datas.limit > response.responseJSON.data.length ) {
						var limit = response.responseJSON.data.length;
					} else {
						var limit = datas.limit;
					}

					for ( var i = 0; i < limit; i++ ) {
						target.append('<div class="instagram__item--'+  datas.grid + '"><a href="' + response.responseJSON.data[i].link + '" target="_blank"><img src="' + response.responseJSON.data[i].images.low_resolution.url + '" alt=""></a></div>');
					}

					// Init slick
					if ( target.hasClass( 'slick-slider' ) ) {
						setTimeout( function () {
							target.slick();
						}, 100);
					}
				}
			})
		}
	}
}

theme.Product_Tabs = function ( id ) {
	var tabId = $( id );
	$( tabId ).find( '.tab__nav li > a' ).click( function ( e ) {
		e.preventDefault();

		var $this = $( this );
		var $tabActive = $this.attr( 'href' );

		$( tabId ).find( '.tab__nav li' ).removeClass( 'tab__nav--active' );
		$this.parent().addClass( 'tab__nav--active' );
		$( tabId ).find( '.tab__pane' ).removeClass( 'tab__pane--active' ).hide();
		$( $tabActive ).addClass( 'tab__pane--active' ).show();
	});
}

theme.Newsletter_Popup = function() {
	if ( ! $( '#newsletter-popup' ).length ) return;

	var ModalOpen = sessionStorage.getItem( 'modalOpen' );

	$( '#hideforever' ).click( function() {
		if ( this.checked ) {
			sessionStorage.setItem( 'modalOpen', false );
		} else {
			sessionStorage.setItem( 'modalOpen', true );
		}
	});

	if ( ModalOpen === null || ModalOpen === '' || ModalOpen === 'true' ) {
		setTimeout( function() {
		   $.magnificPopup.open({
				items: {
					src: '#newsletter-popup' 
				},
				type: 'inline',
				callbacks: {
					open: function() {
						sessionStorage.setItem( 'modalOpen', true );
					}
				}
			});
		}, 5000);
	}
}

theme.Sale_Notification = function() {
	if ( ! $( '.sale-notification' ).length ) return;

	var SaleNotification = sessionStorage.getItem( 'SaleNotification' );

	if ( SaleNotification === null || SaleNotification === '' || SaleNotification === 'true' ) {
		setTimeout( function() {
			$( '.sale-notification' ).addClass( 'active' );

			sessionStorage.setItem( 'SaleNotification', true );
		}, 1000);
	}

	if ( $( '.sale-notification__close' ).length ) {
		$( '.sale-notification__close' ).on( 'click', function( e ) {
			$( '.sale-notification' ).removeClass( 'active' );

			sessionStorage.setItem( 'SaleNotification', false );

			e.preventDefault();
		});
	}
}

theme.init = function () {
	FastClick.attach(document.body);
	theme.cacheSelectors();
	theme.quickView();
	theme.ajaxAddtocart();
	theme.InitSlickSlider();
	theme.sizeChart();
	theme.Cart();
	theme.Newsletter_Popup();
	theme.Sale_Notification();
};

// Initialize theme's JS on document ready
$(theme.init);

theme.Product_Images = (function () {
	var main = '.product-single__photos';
	var nav = '.product-single__thumbnails';

	function init() {
		$(main).imagesLoaded(function () {
			$(main).slick({
				slidesToShow: 1,
				slidesToScroll: 1,
				arrows: false,
				fade: true,
				adaptiveHeight: true,
				asNavFor: nav
			});
		});

		$(nav).imagesLoaded(function () {
			$(nav).slick({
				slidesToShow: 3,
				slidesToScroll: 1,
				asNavFor: main,
				dots: false,
				arrows: false,
				centerMode: true,
				adaptiveHeight: true,
				focusOnSelect: true
			});
		});
	}

	function unload() {
		$(main).slick('unslick');
		$(nav).slick('unslick');
	}

	return {
		init: init,
		unload: unload
	};

})();

// Sections
theme.Header_Section = (function () {
	function Header() {
		theme.ToggleSearch();
		theme.MobileNav();
	}

	Header.prototype = _.assignIn({}, Header.prototype, {
		onUnload: function () {
			delete theme.ToggleSearch();
			delete theme.MobileNav();
		}
	});

	return Header;
})();

theme.Custom_Section = (function () {
	function Instagram_Feed() {
		theme.Instagram_Feed();
	}

	Instagram_Feed.prototype = _.assignIn({}, Instagram_Feed.prototype, {
		onUnload: function () {
			delete theme.Instagram_Feed();
			Instagram_Loaded = false;
		}
	});

	return Instagram_Feed;
})();

theme.Masonry_Section = ( function () {
	function Masonry_Section( container ) {
		var $container = this.$container = $( container ),
			sectionId = $container.attr( 'data-section-id' ),
			el = '.masonry--' + sectionId;
		// Init Isotope
		theme.InitMasonry( el );
	}

	Masonry_Section.prototype = _.assignIn({}, Masonry_Section.prototype, {
		onUnload: function () {
			$( this.el ).isotope( 'destroy' );
		}
	});

	return Masonry_Section;
})();

theme.ProductTabs_Section = ( function () {
	function ProductTabs_Section( container ) {
		var $container = this.$container = $( container ),
			sectionId  = $container.attr( 'data-section-id' ),
			tabId      = this.tabs = '.tab--' + sectionId;

		// Init tabs
		theme.Product_Tabs( tabId );
	}
	return ProductTabs_Section;
})();

theme.Slideshow_Section = (function () {
	function Slideshow_Section(container) {
		var $container = this.$container = $(container),
			sectionId = $container.attr('data-section-id'),
			slideshow = this.slideshow = '#slideshow-' + sectionId;
		// Init slick
		theme.slickSlider(slideshow);
	}

	Slideshow_Section.prototype = _.assignIn({}, Slideshow_Section.prototype, {
		onUnload: function () {
			$(this.slideshow).slick('unslick');
		},

		onBlockSelect: function( evt ) {
			var $slideshow = $(this.slideshow);

			// Ignore the cloned version
			var $slide = $('.slideshow__slide--' + evt.detail.blockId + ':not(.slick-cloned)');
			var slideIndex = $slide.data('slick-index');

			// Go to selected slide, pause autoplay
			$slideshow.slick('slickGoTo', slideIndex).slick('slickPause');
		},

		onBlockDeselect: function () {
			// Resume autoplay
			$(this.slideshow).slick('slickPlay');
		}
	});

	return Slideshow_Section;

})();

theme.Product_Section = (function () {
	function Product_Section() {
		// Init Product Images
		theme.Product_Images.init();
	}

	Product_Section.prototype = _.assignIn({}, Product_Section.prototype, {
		onUnload: function () {
			theme.Product_Images.unload();
		}
	});

	return Product_Section;
})();

theme.Related_Product_Section = (function () {

	function Related_Product_Section() {
		slider = this.slider = $( '.related-products' );
		// Init slick
		theme.slickSlider( $( '.related-products' ) );
	}

	Related_Product_Section.prototype = _.assignIn({}, Related_Product_Section.prototype, {
		onUnload: function () {
			$( this.slider ).slick( 'unslick' );
		}
	});

	return Related_Product_Section;
})();

$( document ).ready( function () {
	var sections = new theme.Sections();
	sections.register( 'header-section', theme.Header_Section );
	sections.register( 'slideshow-section', theme.Slideshow_Section );
	sections.register( 'custom-content-section', theme.Custom_Section );
	sections.register( 'masonry-section', theme.Masonry_Section );
	sections.register( 'product-tabs-section', theme.ProductTabs_Section );
	sections.register( 'product-section', theme.Product_Section );
	sections.register( 'related-products-section', theme.Related_Product_Section );
});