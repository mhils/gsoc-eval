import React from "react";
import ReactDOM from "react-dom";
import _ from "lodash";
import Textarea from "react-textarea-autosize";
import IconRating from './IconRating';


class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			proposals: [],
			data: {},
			user: this.getUser(false)
		};
		this.updateData = this.updateData.bind(this);
		this.addData = this.addData.bind(this);
	}
	componentWillMount() {
		fetch("/proposals.json", {credentials: 'same-origin'}).then(response => {
			response.json().then(v => {
				let proposals = v.results.filter(p => !p.ignored);
				this.setState({proposals});
			})
		});
		fetch("/data", {credentials: 'same-origin'}).then(this.updateData);
	}
	getUser(prompt = true) {
		if(prompt && !this.state.user){
			let user = window.prompt("Enter username:");
			window.localStorage["user"] = user;
			this.setState({user});
			return user;
		}
		return window.localStorage["user"];
	}
	addData(proposalId, data){
		data.user = this.getUser();
		if(!data.user){
			console.error("Unknown user");
		}
		console.log("addData", proposalId, data);
		fetch(`/data/${proposalId}`, {
			method: "POST",
			headers:{
				"Accept": "application/json",
				"Content-Type": "application/json"
			},
			credentials: 'same-origin',
			body: JSON.stringify(data)
		}
		).then(this.updateData);
	}
	updateData(response) {
		response.json().then(v => {
			console.debug("updateData", v);
			this.setState({data: v});
		});
	}	
	render() {
		let {proposals, user} = this.state;
		let groups = _.groupBy(
			proposals,
			(p) => p.subcategory
		);
		console.debug(groups, groups.mitmproxy);
		let proposalGroups = Object.keys(groups).map((group) => 
			<ProposalGroup 
				key={group}
				name={group}
				addData={this.addData}
				{...this.state}
				proposals={groups[group]}/>
		);

		return <div>
		<UserDisplay user={user}/>
		{proposalGroups}
		</div>;
	}
}

function UserDisplay({user}) {
	return <span className="pull-right">{user ? `User: ${user}` : null}</span>;
}

function ProposalGroup({name, addData, proposals, data, user}) {
	return <div>
		<h1>Proposals for {name || "other projects"}</h1>
		{proposals.map(p => 
			<Proposal 
				key={p.id}
				data={data}
				user={user}
				addData={addData}
				{...p} />
		)}
	</div>;
}

function Proposal(props) {
	let {title, student, abstract} = props;
	return <div className="panel panel-default">
		<div className="panel-heading">
			<strong>{student.display_name}</strong>: {title} 
			<span className="pull-right">
				<ViewRating {...props}/>
				&nbsp;
				<MelangeLink {...props}/>
				&nbsp;
				<ProposalLink {...props}/>
			</span>
		</div>
		<div className="panel-body">
			<small>{abstract}</small>
		</div>
		<ProposalComments {...props}/>
	</div>;
}

function Comment({user, comment}) {
	return <li className="list-group-item">
		<strong>{user}:</strong> {comment}
	</li>;
}

function ProposalComments(props) {
	let {id, data, user} = props;
	data = data[id] || [];
	let i = 0; 
	let comments = data
		.filter(d => d.comment)
		.map(c => <Comment key={i++} {...c}/>);
	let currentRating = _.chain(data)
		.filter(d => d.user === user)
		.filter(d => d.rating !== undefined)
		.last()
		.rating;

	return <ul className="list-group">
		{comments}
		<AddComment currentRating={currentRating} {...props}/>
	</ul>;
}

function Rating(props){
	return <IconRating
		toggledClassName="text-primary glyphicon glyphicon-star" 
		untoggledClassName="glyphicon glyphicon-star-empty"
		{...props}/>;
}

function ViewRating({id, data}){
	data = data[id] || [];
	let ratings = _.chain(data)
		.filter(d => d.rating)
		// only take last rating per user
		.reverse()
		.uniqBy(d => d.user);
	let average = ratings
		.map(d => d.rating)
		.mean().value();
	let count = ratings.size().value();
	if(count === 0){ 
		return <span/>;
	}
	// Dirty: Add pull-left to make it inline...
	return <span className="text-muted">
	<div className="pull-left">
	({count}) &nbsp;
	</div>
	<div className="pull-left" title={"Ø " + average}>
	<Rating 
		currentRating={average}
		viewOnly={true}
	/></div></span>;
}

function AddRating({id, addData, currentRating}) {
	return <Rating 
		currentRating={currentRating}
		onChange={(rating) => addData(id, {rating}) }/>;
}

class AddComment extends React.Component {
	constructor(props){
		super(props);
		this.state = {
			value: "",
			expand: false
		};
	}
	submit(e){
		console.log("submit", this.state.value, e);
		e.preventDefault();
		this.props.addData(this.props.id, {comment: this.state.value});
		this.setState({expand: false, value: ""});
	}
	render(){
		let content;
		if(this.state.expand){
			content = <form className="form" onSubmit={this.submit.bind(this)}>
				<div className="form-group">
				<Textarea 
					className="form-control" 
					minRows={1} 
					placeholder="Add Comment"
				    value={this.state.value}
				    onChange={e => this.setState({value: e.target.value})}
				/>
				</div>
				<button type="submit" className="btn btn-xs btn-default">Submit</button>
				&nbsp;
				<button 
					className="btn btn-xs btn-default"
					onClick={e => e.preventDefault() & this.setState({expand: false})}>
					Cancel
				</button>
			</form>;
		} else {
			content = <div>
				<div className="pull-right">
					<AddRating {...this.props}/>
				</div>
				<button 
					className="btn btn-xs btn-default"
					onClick={() => this.setState({expand: true})}>
					<span className="glyphicon glyphicon-comment"/> Add Comment
				</button>
			</div>;
		}
		return <li className="list-group-item">
			{content}
		</li>;
	}
}

function MelangeLink({organization_id, id}) {
	let url = `https://summerofcode.withgoogle.com/dashboard/organization/${organization_id}/proposal/${id}/`;
	return <a
	title="Open proposal on GSoC site"
	href={url} 
	className="glyphicon glyphicon-new-window"></a>;
}

function ProposalLink({completed_pdf_url}) {
	let url = `https://summerofcode.withgoogle.com${completed_pdf_url}`;
	return <a 
	title="View Proposal PDF"
	href={url} 
	className="glyphicon glyphicon-file"></a>;
}

document.addEventListener("DOMContentLoaded", () => {
	ReactDOM.render(
		<App/>,
		document.getElementById("main")
	);
});