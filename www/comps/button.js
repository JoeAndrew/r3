export {MyButton as default};

let MyButton = {
	name:'my-button',
	template:`<div class="button"
		@click.exact="trigger"
		@click.shift="triggerShift"
		@click.prevent.middle="triggerMiddle"
		@click.prevent.right="triggerRight"
		@keyup.enter.space="trigger"
		:class="classes"
		:tabindex="active ? 0 : -1"
		:title="captionTitle"
	>
		<img draggable="false"
			v-if="image !== '' || imageBase64 !== ''"
			:src="image !== '' ? 'images/'+image : imageBase64"
			:title="captionTitle"
		/>
		<span
			v-if="caption !== ''"
			:title="captionTitle"
		>{{ caption }}</span>
	</div>`,
	props:{
		// content props
		active:      { type:Boolean, required:false, default:true },
		blockBubble: { type:Boolean, required:false, default:false },
		caption:     { type:String,  required:false, default:'' },
		captionTitle:{ type:String,  required:false, default:'' },
		image:       { type:String,  required:false, default:'' },
		imageBase64: { type:String,  required:false, default:'' },
		
		// style props
		adjusts:{ type:Boolean, required:false, default:false }, // adjusts its length to avail. space (text is ellipsed if too small)
		cancel: { type:Boolean, required:false, default:false },
		large:  { type:Boolean, required:false, default:false },
		naked:  { type:Boolean, required:false, default:false }
	},
	emits:['trigger','trigger-middle','trigger-right','trigger-shift'],
	computed:{
		classes:(s) => {
			return {
				adjusts:s.adjusts,
				cancel:s.cancel,
				clickable:s.active,
				inactive:!s.active,
				large:s.large,
				naked:s.naked,
				noHighlight:!s.active
			};
		}
	},
	methods:{
		trigger(ev) {
			if(!this.active) return;
			
			if(this.blockBubble)
				ev.stopPropagation();
			
			this.$emit('trigger');
		},
		triggerMiddle(ev) {
			if(!this.active) return;
			
			if(this.blockBubble)
				ev.stopPropagation();
			
			this.$emit('trigger-middle');
		},
		triggerRight(ev) {
			if(!this.active) return;
			
			if(this.blockBubble)
				ev.stopPropagation();
			
			this.$emit('trigger-right');
		},
		triggerShift(ev) {
			if(!this.active) return;
			
			if(this.blockBubble)
				ev.stopPropagation();
			
			this.$emit('trigger-shift');
		}
	}
};