import React from "react";
import { TrendingUp, Code, Users, User, Mail, Lock, Check } from "lucide-react";

// core components
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";
import Button from "components/CustomButtons/Button.js";
import InfoArea from "components/InfoArea/InfoArea.js";
import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";

export default function RegisterPage() {
  const [checked, setChecked] = React.useState([]);
  const handleToggle = (value) => {
    const currentIndex = checked.indexOf(value);
    const newChecked = [...checked];

    if (currentIndex === -1) {
      newChecked.push(value);
    } else {
      newChecked.splice(currentIndex, 1);
    }
    setChecked(newChecked);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <GridContainer className="w-full justify-center">
        <GridItem xs={12} sm={12} md={10}>
          <Card className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold text-center text-foreground mt-6 mb-0">
              Register
            </h2>
            <CardBody>
              <GridContainer className="justify-center">
                <GridItem xs={12} sm={12} md={5}>
                  <InfoArea
                    title="Marketing"
                    description="We've created the marketing campaign of the website. It was a very interesting collaboration."
                    icon={TrendingUp}
                    iconColor="rose"
                  />
                  <InfoArea
                    title="Fully Coded in HTML5"
                    description="We've developed the website with HTML5 and CSS3. The client has access to the code using GitHub."
                    icon={Code}
                    iconColor="primary"
                  />
                  <InfoArea
                    title="Built Audience"
                    description="There is also a Fully Customizable CMS Admin Dashboard for this product."
                    icon={Users}
                    iconColor="info"
                  />
                </GridItem>
                <GridItem xs={12} sm={8} md={5}>
                  <div className="text-center mb-4">
                    <Button justIcon round color="info">
                      <i className="fab fa-twitter" />
                    </Button>
                    {` `}
                    <Button justIcon round color="danger">
                      <i className="fab fa-dribbble" />
                    </Button>
                    {` `}
                    <Button justIcon round color="info">
                      <i className="fab fa-facebook-f" />
                    </Button>
                    {` `}
                    <h4 className="mt-3 text-sm font-medium text-muted-foreground">
                      or be classical
                    </h4>
                  </div>
                  <form>
                    <div className="mb-4 w-full relative">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          <User className="h-4 w-4" />
                        </span>
                        <input
                          id="first_name"
                          name="first_name"
                          autoComplete="given-name"
                          placeholder="First Name..."
                          className="flex h-9 w-full rounded-md border border-input bg-transparent pl-10 pr-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                    </div>
                    <div className="mb-4 w-full relative">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                        </span>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          placeholder="Email..."
                          className="flex h-9 w-full rounded-md border border-input bg-transparent pl-10 pr-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                    </div>
                    <div className="mb-4 w-full relative">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          <Lock className="h-4 w-4" />
                        </span>
                        <input
                          id="password"
                          name="password"
                          type="password"
                          autoComplete="new-password"
                          placeholder="Password..."
                          className="flex h-9 w-full rounded-md border border-input bg-transparent pl-10 pr-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                    </div>
                    <label className="flex items-start gap-3 cursor-pointer my-4">
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={checked.indexOf(1) !== -1}
                        onClick={() => handleToggle(1)}
                        className={`flex-shrink-0 h-5 w-5 rounded border transition-colors flex items-center justify-center mt-0.5 ${
                          checked.indexOf(1) !== -1
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-input bg-transparent hover:border-ring"
                        }`}
                      >
                        {checked.indexOf(1) !== -1 && <Check className="h-3 w-3" />}
                      </button>
                      <span className="text-sm text-muted-foreground">
                        I agree to the{" "}
                        <a href="#pablo" className="text-primary hover:underline">
                          terms and conditions
                        </a>
                        .
                      </span>
                    </label>
                    <div className="text-center">
                      <Button round color="primary">
                        Get started
                      </Button>
                    </div>
                  </form>
                </GridItem>
              </GridContainer>
            </CardBody>
          </Card>
        </GridItem>
      </GridContainer>
    </div>
  );
}
